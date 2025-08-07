import { type Session, type InsertSession, type SwipeAction, type InsertSwipeAction, type BabyName, type InsertBabyName } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteExpiredSessions(): Promise<void>;
  
  // Swipe actions
  createSwipeAction(action: InsertSwipeAction): Promise<SwipeAction>;
  getSwipeActionsBySession(sessionId: string): Promise<SwipeAction[]>;
  getSwipeActionsBySessionAndUser(sessionId: string, userId: string): Promise<SwipeAction[]>;
  getMatches(sessionId: string): Promise<{ nameId: string; users: string[] }[]>;
  
  // Baby names
  getAllBabyNames(): Promise<BabyName[]>;
  getBabyNamesByGender(gender: string): Promise<BabyName[]>;
  getBabyNameById(id: string): Promise<BabyName | undefined>;
  initializeBabyNames(): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private swipeActions: Map<string, SwipeAction>;
  private babyNames: Map<string, BabyName>;

  constructor() {
    this.sessions = new Map();
    this.swipeActions = new Map();
    this.babyNames = new Map();
    this.initializeBabyNames();
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      id,
      createdAt: new Date(),
      expiresAt: insertSession.expiresAt,
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [id, session] of Array.from(this.sessions.entries())) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
      }
    }
  }

  async createSwipeAction(insertAction: InsertSwipeAction): Promise<SwipeAction> {
    const id = randomUUID();
    const action: SwipeAction = {
      id,
      ...insertAction,
      createdAt: new Date(),
    };
    this.swipeActions.set(id, action);
    return action;
  }

  async getSwipeActionsBySession(sessionId: string): Promise<SwipeAction[]> {
    return Array.from(this.swipeActions.values()).filter(
      action => action.sessionId === sessionId
    );
  }

  async getSwipeActionsBySessionAndUser(sessionId: string, userId: string): Promise<SwipeAction[]> {
    return Array.from(this.swipeActions.values()).filter(
      action => action.sessionId === sessionId && action.userId === userId
    );
  }

  async getMatches(sessionId: string): Promise<{ nameId: string; users: string[] }[]> {
    const actions = await this.getSwipeActionsBySession(sessionId);
    const likes = actions.filter(action => action.action === 'like');
    
    const nameGroups = new Map<string, string[]>();
    
    for (const like of likes) {
      if (!nameGroups.has(like.nameId)) {
        nameGroups.set(like.nameId, []);
      }
      nameGroups.get(like.nameId)!.push(like.userId);
    }
    
    // Only return names that have been liked by more than one user
    return Array.from(nameGroups.entries())
      .filter(([_, users]) => users.length > 1)
      .map(([nameId, users]) => ({ nameId, users }));
  }

  async getAllBabyNames(): Promise<BabyName[]> {
    return Array.from(this.babyNames.values());
  }

  async getBabyNamesByGender(gender: string): Promise<BabyName[]> {
    if (gender === 'all') {
      return this.getAllBabyNames();
    }
    return Array.from(this.babyNames.values()).filter(
      name => name.gender === gender || name.gender === 'unisex'
    );
  }

  async getBabyNameById(id: string): Promise<BabyName | undefined> {
    return this.babyNames.get(id);
  }

  async initializeBabyNames(): Promise<void> {
    const names: BabyName[] = [
      { id: 'emma', name: 'Emma', gender: 'girl', origin: 'Germanic', meaning: '"Whole" or "universal". A classic name that has remained popular for centuries.', rank: 2, category: 'Traditional' },
      { id: 'liam', name: 'Liam', gender: 'boy', origin: 'Irish', meaning: '"Strong-willed warrior and protector". Modern and strong name.', rank: 1, category: 'Modern' },
      { id: 'sophia', name: 'Sophia', gender: 'girl', origin: 'Greek', meaning: '"Wisdom". Elegant and timeless name with classical roots.', rank: 5, category: 'Classic' },
      { id: 'noah', name: 'Noah', gender: 'boy', origin: 'Hebrew', meaning: '"Rest" or "comfort". Biblical name with peaceful meaning.', rank: 3, category: 'Traditional' },
      { id: 'oliver', name: 'Oliver', gender: 'boy', origin: 'Latin', meaning: '"Olive tree". Symbol of peace and fruitfulness.', rank: 4, category: 'Classic' },
      { id: 'ava', name: 'Ava', gender: 'girl', origin: 'Latin', meaning: '"Life" or "bird". Short and sweet with timeless appeal.', rank: 6, category: 'Modern' },
      { id: 'ethan', name: 'Ethan', gender: 'boy', origin: 'Hebrew', meaning: '"Firm" or "steadfast". Strong and reliable name.', rank: 7, category: 'Traditional' },
      { id: 'isabella', name: 'Isabella', gender: 'girl', origin: 'Hebrew', meaning: '"God is my oath". Elegant and sophisticated name.', rank: 8, category: 'Classic' },
      { id: 'william', name: 'William', gender: 'boy', origin: 'Germanic', meaning: '"Resolute protector". Timeless royal name.', rank: 9, category: 'Traditional' },
      { id: 'mia', name: 'Mia', gender: 'girl', origin: 'Scandinavian', meaning: '"Mine" or "bitter". Short and sweet modern name.', rank: 10, category: 'Modern' },
      { id: 'james', name: 'James', gender: 'boy', origin: 'Hebrew', meaning: '"Supplanter". Classic name with enduring popularity.', rank: 11, category: 'Traditional' },
      { id: 'charlotte', name: 'Charlotte', gender: 'girl', origin: 'French', meaning: '"Free man". Elegant name with royal connections.', rank: 12, category: 'Classic' },
      { id: 'benjamin', name: 'Benjamin', gender: 'boy', origin: 'Hebrew', meaning: '"Son of the right hand". Biblical name with modern appeal.', rank: 13, category: 'Traditional' },
      { id: 'amelia', name: 'Amelia', gender: 'girl', origin: 'Germanic', meaning: '"Work" or "industrious". Strong and feminine name.', rank: 14, category: 'Classic' },
      { id: 'lucas', name: 'Lucas', gender: 'boy', origin: 'Latin', meaning: '"Light" or "illumination". Bright and modern name.', rank: 15, category: 'Modern' },
      { id: 'harper', name: 'Harper', gender: 'girl', origin: 'English', meaning: '"Harp player". Modern occupational name.', rank: 16, category: 'Modern' },
      { id: 'henry', name: 'Henry', gender: 'boy', origin: 'Germanic', meaning: '"Estate ruler". Classic name with royal heritage.', rank: 17, category: 'Traditional' },
      { id: 'evelyn', name: 'Evelyn', gender: 'girl', origin: 'English', meaning: '"Wished for child". Vintage name making a comeback.', rank: 18, category: 'Classic' },
      { id: 'alexander', name: 'Alexander', gender: 'boy', origin: 'Greek', meaning: '"Defender of men". Strong historical name.', rank: 19, category: 'Classic' },
      { id: 'abigail', name: 'Abigail', gender: 'girl', origin: 'Hebrew', meaning: '"Father\'s joy". Traditional name with modern appeal.', rank: 20, category: 'Traditional' }
    ];

    for (const name of names) {
      this.babyNames.set(name.id, name);
    }
  }
}

export const storage = new MemStorage();
