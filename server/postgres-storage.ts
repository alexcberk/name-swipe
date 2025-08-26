import { eq, and, sql as sqlOperator } from "drizzle-orm";
import { createDatabaseConnection } from "./database";
import {
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type SwipeAction,
  type InsertSwipeAction,
  type BabyName,
  type InsertBabyName,
  type UserSession,
  type InsertUserSession,
  users,
  sessions,
  swipeActions,
  babyNames,
  userSessions,
} from "@shared/schema";
import { type IStorage } from "./storage";
import { babyNamesDatabase } from "../client/src/lib/baby-names";
import { randomUUID } from "crypto";

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof createDatabaseConnection>;
  private initialized = false;

  constructor(databaseUrl: string) {
    this.db = createDatabaseConnection(databaseUrl);
  }

  private generateShareCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        ...insertUser,
        id: randomUUID(),
      })
      .returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async updateUserActivity(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, id));
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await this.db
      .insert(sessions)
      .values({
        ...insertSession,
        id: randomUUID(),
        shareCode: this.generateShareCode(),
      })
      .returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id));
    return session;
  }

  async getSessionByShareCode(shareCode: string): Promise<Session | undefined> {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.shareCode, shareCode));
    return session;
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.db
      .delete(sessions)
      .where(sqlOperator`${sessions.expiresAt} < NOW()`);
  }

  async addUserToSession(insertUserSession: InsertUserSession): Promise<UserSession> {
    // Check if user already in session
    const existing = await this.db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, insertUserSession.userId),
          eq(userSessions.sessionId, insertUserSession.sessionId)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [userSession] = await this.db
      .insert(userSessions)
      .values(insertUserSession)
      .returning();
    return userSession;
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return await this.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId));
  }

  async getSessionUsers(sessionId: string): Promise<UserSession[]> {
    return await this.db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionId, sessionId));
  }

  async createSwipeAction(insertAction: InsertSwipeAction): Promise<SwipeAction> {
    // Check if there's already a swipe for this user + name combination
    const existingActions = await this.db
      .select()
      .from(swipeActions)
      .where(
        and(
          eq(swipeActions.userId, insertAction.userId),
          eq(swipeActions.nameId, insertAction.nameId),
          insertAction.sessionId 
            ? eq(swipeActions.sessionId, insertAction.sessionId)
            : sqlOperator`${swipeActions.sessionId} IS NULL`,
          eq(swipeActions.isGlobal, insertAction.isGlobal ?? true)
        )
      );

    if (existingActions.length > 0) {
      // Update existing action
      const [updated] = await this.db
        .update(swipeActions)
        .set({
          action: insertAction.action,
          createdAt: new Date(),
        })
        .where(eq(swipeActions.id, existingActions[0].id))
        .returning();
      return updated;
    } else {
      // Create new action
      const [action] = await this.db
        .insert(swipeActions)
        .values({
          ...insertAction,
          id: randomUUID(),
          sessionId: insertAction.sessionId || null,
          isGlobal: insertAction.isGlobal ?? true,
        })
        .returning();
      return action;
    }
  }

  async getSwipeActionsByUser(userId: string): Promise<SwipeAction[]> {
    return await this.db
      .select()
      .from(swipeActions)
      .where(eq(swipeActions.userId, userId));
  }

  async getSwipeActionsBySession(sessionId: string): Promise<SwipeAction[]> {
    return await this.db
      .select()
      .from(swipeActions)
      .where(eq(swipeActions.sessionId, sessionId));
  }

  async getSwipeActionsBySessionAndUser(sessionId: string, userId: string): Promise<SwipeAction[]> {
    return await this.db
      .select()
      .from(swipeActions)
      .where(
        and(
          eq(swipeActions.sessionId, sessionId),
          eq(swipeActions.userId, userId)
        )
      );
  }

  async getMatches(sessionId: string): Promise<{ nameId: string; users: string[] }[]> {
    const actions = await this.getSwipeActionsBySession(sessionId);
    const likes = actions.filter(action => action.action === 'like');
    
    const nameGroups = new Map<string, Set<string>>();
    
    for (const like of likes) {
      if (!nameGroups.has(like.nameId)) {
        nameGroups.set(like.nameId, new Set());
      }
      nameGroups.get(like.nameId)!.add(like.userId);
    }
    
    // Only return names that have been liked by more than one user
    return Array.from(nameGroups.entries())
      .filter(([_, userSet]) => userSet.size > 1)
      .map(([nameId, userSet]) => ({ nameId, users: Array.from(userSet) }));
  }

  async getUserMatches(userId: string): Promise<{ nameId: string; matchType: 'personal' | 'session'; sessionId?: string }[]> {
    const userActions = await this.getSwipeActionsByUser(userId);
    const likes = userActions.filter(action => action.action === 'like');
    
    const matches: { nameId: string; matchType: 'personal' | 'session'; sessionId?: string }[] = [];
    
    // Personal matches (user's own likes)
    const personalLikes = likes.filter(like => like.isGlobal);
    for (const like of personalLikes) {
      if (!matches.find(m => m.nameId === like.nameId)) {
        matches.push({ nameId: like.nameId, matchType: 'personal' });
      }
    }
    
    // Session matches (matched with partners)
    const sessionLikes = likes.filter(like => like.sessionId);
    for (const like of sessionLikes) {
      if (like.sessionId) {
        const sessionMatches = await this.getMatches(like.sessionId);
        for (const match of sessionMatches) {
          if (match.users.includes(userId) && !matches.find(m => m.nameId === match.nameId && m.sessionId === like.sessionId)) {
            matches.push({ nameId: match.nameId, matchType: 'session', sessionId: like.sessionId });
          }
        }
      }
    }
    
    return matches;
  }

  async getAllBabyNames(): Promise<BabyName[]> {
    // Initialize names if not already done
    if (!this.initialized) {
      await this.initializeBabyNames();
    }
    
    return await this.db.select().from(babyNames);
  }

  async getBabyNamesByGender(gender: string): Promise<BabyName[]> {
    // Initialize names if not already done
    if (!this.initialized) {
      await this.initializeBabyNames();
    }
    
    if (gender === 'all') {
      return this.getAllBabyNames();
    }
    
    return await this.db
      .select()
      .from(babyNames)
      .where(
        sqlOperator`${babyNames.gender} = ${gender} OR ${babyNames.gender} = 'unisex'`
      );
  }

  async getBabyNameById(id: string): Promise<BabyName | undefined> {
    const [name] = await this.db
      .select()
      .from(babyNames)
      .where(eq(babyNames.id, id));
    return name;
  }

  async initializeBabyNames(): Promise<void> {
    // Check if baby names are already initialized
    const existingNames = await this.db.select().from(babyNames).limit(1);
    if (existingNames.length > 0) {
      this.initialized = true;
      return;
    }

    // Batch insert all baby names from the database
    const namesToInsert = babyNamesDatabase.map(name => ({
      id: name.id,
      name: name.name,
      gender: name.gender,
      origin: name.origin,
      meaning: name.meaning,
      rank: name.rank || null,
      category: name.category,
    }));

    // Insert in batches of 100 to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < namesToInsert.length; i += batchSize) {
      const batch = namesToInsert.slice(i, i + batchSize);
      await this.db.insert(babyNames).values(batch);
    }

    this.initialized = true;
    console.log(`Initialized ${namesToInsert.length} baby names in database`);
  }
}