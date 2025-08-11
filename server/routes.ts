import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSessionSchema, insertSwipeActionSchema, genderFilterSchema, insertUserSessionSchema } from "@shared/schema";
import { z } from "zod";

interface WSMessage {
  type: 'join_session' | 'swipe_action' | 'partner_connected' | 'partner_disconnected' | 'new_match';
  sessionId?: string;
  userId?: string;
  data?: any;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time functionality
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track active connections by session
  const sessionConnections = new Map<string, Map<string, WebSocket>>();
  
  wss.on('connection', (ws: WebSocket) => {
    let currentSessionId: string | null = null;
    let currentUserId: string | null = null;
    
    ws.on('message', async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_session':
            if (message.sessionId && message.userId) {
              currentSessionId = message.sessionId;
              currentUserId = message.userId;
              
              // Add to session connections
              if (!sessionConnections.has(currentSessionId)) {
                sessionConnections.set(currentSessionId, new Map());
              }
              sessionConnections.get(currentSessionId)!.set(currentUserId, ws);
              
              // Notify other users in session
              const sessionUsers = sessionConnections.get(currentSessionId)!;
              for (const [userId, userWs] of Array.from(sessionUsers.entries())) {
                if (userId !== currentUserId && userWs.readyState === WebSocket.OPEN) {
                  userWs.send(JSON.stringify({
                    type: 'partner_connected',
                    data: { userId: currentUserId }
                  }));
                }
              }
            }
            break;
            
          case 'swipe_action':
            if (currentSessionId && currentUserId && message.data) {
              // Broadcast swipe to other users in session
              const sessionUsers = sessionConnections.get(currentSessionId);
              if (sessionUsers) {
                for (const [userId, userWs] of Array.from(sessionUsers.entries())) {
                  if (userId !== currentUserId && userWs.readyState === WebSocket.OPEN) {
                    userWs.send(JSON.stringify({
                      type: 'swipe_action',
                      data: {
                        userId: currentUserId,
                        nameId: message.data.nameId,
                        action: message.data.action
                      }
                    }));
                  }
                }
              }
              
              // Check for new matches
              const matches = await storage.getMatches(currentSessionId);
              const newMatch = matches.find(match => 
                match.nameId === message.data.nameId && 
                match.users.length > 1
              );
              
              if (newMatch) {
                // Notify all users in session about the match
                const sessionUsers = sessionConnections.get(currentSessionId);
                if (sessionUsers) {
                  for (const [_, userWs] of Array.from(sessionUsers.entries())) {
                    if (userWs.readyState === WebSocket.OPEN) {
                      userWs.send(JSON.stringify({
                        type: 'new_match',
                        data: { nameId: message.data.nameId }
                      }));
                    }
                  }
                }
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (currentSessionId && currentUserId) {
        // Remove from session connections
        const sessionUsers = sessionConnections.get(currentSessionId);
        if (sessionUsers) {
          sessionUsers.delete(currentUserId);
          if (sessionUsers.size === 0) {
            sessionConnections.delete(currentSessionId);
          } else {
            // Notify remaining users
            for (const [_, userWs] of Array.from(sessionUsers.entries())) {
              if (userWs.readyState === WebSocket.OPEN) {
                userWs.send(JSON.stringify({
                  type: 'partner_disconnected',
                  data: { userId: currentUserId }
                }));
              }
            }
          }
        }
      }
    });
  });

  // API Routes
  
  // Create or get user
  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser({});
      await storage.updateUserActivity(user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get user details
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUserActivity(user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user's matches (personal and session)
  app.get("/api/users/:userId/matches", async (req, res) => {
    try {
      const { userId } = req.params;
      const matches = await storage.getUserMatches(userId);
      
      // Enrich with baby name details
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const babyName = await storage.getBabyNameById(match.nameId);
          return {
            ...match,
            name: babyName
          };
        })
      );
      
      res.json(enrichedMatches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user matches" });
    }
  });

  // Get user's swipe history
  app.get("/api/users/:userId/swipes", async (req, res) => {
    try {
      const { userId } = req.params;
      const actions = await storage.getSwipeActionsByUser(userId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user swipes" });
    }
  });

  // Create a new session
  app.post("/api/sessions", async (req, res) => {
    try {
      const { userId } = req.body;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const session = await storage.createSession({ expiresAt });
      
      // If userId provided, add user to session as owner
      if (userId) {
        await storage.addUserToSession({
          userId,
          sessionId: session.id,
          role: 'owner'
        });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Get session by share code
  app.get("/api/sessions/by-code/:shareCode", async (req, res) => {
    try {
      const session = await storage.getSessionByShareCode(req.params.shareCode);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if expired
      if (session.expiresAt < new Date()) {
        return res.status(410).json({ message: "Session expired" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // Join a session
  app.post("/api/sessions/:sessionId/join", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      // Verify session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if expired
      if (session.expiresAt < new Date()) {
        return res.status(410).json({ message: "Session expired" });
      }
      
      // Add user to session as partner
      const userSession = await storage.addUserToSession({
        userId,
        sessionId,
        role: 'partner'
      });
      
      res.json({ session, userSession });
    } catch (error) {
      res.status(500).json({ message: "Failed to join session" });
    }
  });

  // Get session details
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if expired
      if (session.expiresAt < new Date()) {
        return res.status(410).json({ message: "Session expired" });
      }
      
      // Get session users
      const users = await storage.getSessionUsers(session.id);
      
      res.json({ ...session, users });
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // Get baby names with optional gender filter
  app.get("/api/baby-names", async (req, res) => {
    try {
      const genderParam = req.query.gender as string;
      const result = genderFilterSchema.safeParse(genderParam || 'all');
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid gender filter" });
      }
      
      const names = await storage.getBabyNamesByGender(result.data);
      res.json(names);
    } catch (error) {
      res.status(500).json({ message: "Failed to get baby names" });
    }
  });

  // Record a swipe action
  app.post("/api/swipe-actions", async (req, res) => {
    try {
      const result = insertSwipeActionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid swipe action data" });
      }

      // If sessionId provided, verify it exists
      if (result.data.sessionId) {
        const session = await storage.getSession(result.data.sessionId);
        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }
      }

      // Update user activity
      await storage.updateUserActivity(result.data.userId);

      // Create both personal and session swipes if in a session
      const swipeActions = [];
      
      // Always create personal swipe
      const personalSwipe = await storage.createSwipeAction({
        ...result.data,
        sessionId: null,
        isGlobal: true
      });
      swipeActions.push(personalSwipe);
      
      // If in a session, also create session swipe
      if (result.data.sessionId) {
        const sessionSwipe = await storage.createSwipeAction({
          ...result.data,
          isGlobal: false
        });
        swipeActions.push(sessionSwipe);
      }
      
      res.json(swipeActions);
    } catch (error) {
      res.status(500).json({ message: "Failed to record swipe action" });
    }
  });

  // Get user's swipe actions for a session
  app.get("/api/sessions/:sessionId/users/:userId/swipes", async (req, res) => {
    try {
      const { sessionId, userId } = req.params;
      const actions = await storage.getSwipeActionsBySessionAndUser(sessionId, userId);
      res.json(actions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get swipe actions" });
    }
  });

  // Get matches for a session
  app.get("/api/sessions/:sessionId/matches", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const matches = await storage.getMatches(sessionId);
      
      // Enrich with baby name details
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const babyName = await storage.getBabyNameById(match.nameId);
          return {
            ...match,
            name: babyName
          };
        })
      );
      
      res.json(enrichedMatches);
    } catch (error) {
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  return httpServer;
}
