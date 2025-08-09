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
    // Check if there's already a swipe for this user + name combination
    const existingAction = Array.from(this.swipeActions.values()).find(
      action => action.userId === insertAction.userId && 
                action.nameId === insertAction.nameId &&
                action.sessionId === insertAction.sessionId
    );
    
    if (existingAction) {
      // Update existing action
      existingAction.action = insertAction.action;
      existingAction.createdAt = new Date();
      return existingAction;
    } else {
      // Create new action
      const id = randomUUID();
      const action: SwipeAction = {
        id,
        ...insertAction,
        createdAt: new Date(),
      };
      this.swipeActions.set(id, action);
      return action;
    }
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
      // 2025 Top Boys Names (1-50)
      { id: 'liam', name: 'Liam', gender: 'boy', origin: 'Irish', meaning: '"Strong-willed warrior and protector". Most popular name for 6th consecutive year.', rank: 1, category: 'Modern' },
      { id: 'noah', name: 'Noah', gender: 'boy', origin: 'Hebrew', meaning: '"Rest" or "comfort". Biblical name with enduring appeal.', rank: 2, category: 'Traditional' },
      { id: 'oliver', name: 'Oliver', gender: 'boy', origin: 'Latin', meaning: '"Olive tree". Symbol of peace and fruitfulness.', rank: 3, category: 'Classic' },
      { id: 'theodore', name: 'Theodore', gender: 'boy', origin: 'Greek', meaning: '"Gift of God". Classic name experiencing renaissance.', rank: 4, category: 'Classic' },
      { id: 'henry', name: 'Henry', gender: 'boy', origin: 'Germanic', meaning: '"Estate ruler". Timeless name with royal heritage.', rank: 5, category: 'Traditional' },
      { id: 'james', name: 'James', gender: 'boy', origin: 'Hebrew', meaning: '"Supplanter". Classic name with enduring popularity.', rank: 6, category: 'Traditional' },
      { id: 'mateo', name: 'Mateo', gender: 'boy', origin: 'Spanish', meaning: '"Gift of God". Rising international name.', rank: 7, category: 'Modern' },
      { id: 'luca', name: 'Luca', gender: 'boy', origin: 'Italian', meaning: '"Light" or "illumination". Short and strong modern choice.', rank: 8, category: 'Modern' },
      { id: 'benjamin', name: 'Benjamin', gender: 'boy', origin: 'Hebrew', meaning: '"Son of the right hand". Biblical name with modern appeal.', rank: 9, category: 'Traditional' },
      { id: 'theo', name: 'Theo', gender: 'boy', origin: 'Greek', meaning: '"God". Short and sweet modern choice.', rank: 10, category: 'Modern' },
      { id: 'felix', name: 'Felix', gender: 'boy', origin: 'Latin', meaning: '"Happy" or "fortunate". Cheerful classic name.', rank: 11, category: 'Classic' },
      { id: 'arlo', name: 'Arlo', gender: 'boy', origin: 'Germanic', meaning: '"Fortified hill". Trendy vintage choice.', rank: 12, category: 'Modern' },
      { id: 'leo', name: 'Leo', gender: 'boy', origin: 'Latin', meaning: '"Lion". Strong and regal name.', rank: 13, category: 'Classic' },
      { id: 'atlas', name: 'Atlas', gender: 'boy', origin: 'Greek', meaning: '"To endure". Strong mythological name.', rank: 14, category: 'Modern' },
      { id: 'kai', name: 'Kai', gender: 'boy', origin: 'Hawaiian', meaning: '"Ocean". Short international name.', rank: 15, category: 'Modern' },
      { id: 'rowan', name: 'Rowan', gender: 'boy', origin: 'Irish', meaning: '"Red-haired". Nature-inspired unisex name.', rank: 16, category: 'Modern' },
      { id: 'jasper', name: 'Jasper', gender: 'boy', origin: 'Persian', meaning: '"Bringer of treasure". Gemstone name.', rank: 17, category: 'Classic' },
      { id: 'adrian', name: 'Adrian', gender: 'boy', origin: 'Latin', meaning: '"From Hadria". Sophisticated choice.', rank: 18, category: 'Classic' },
      { id: 'remy', name: 'Remy', gender: 'boy', origin: 'French', meaning: '"Oarsman". Charming French name.', rank: 19, category: 'Modern' },
      { id: 'asher', name: 'Asher', gender: 'boy', origin: 'Hebrew', meaning: '"Happy" or "blessed". Biblical name on the rise.', rank: 20, category: 'Traditional' },
      { id: 'finn', name: 'Finn', gender: 'boy', origin: 'Irish', meaning: '"Fair" or "white". Irish mythological name.', rank: 21, category: 'Modern' },
      { id: 'oscar', name: 'Oscar', gender: 'boy', origin: 'Irish', meaning: '"Divine spear". Classic with literary connections.', rank: 22, category: 'Classic' },
      { id: 'ezra', name: 'Ezra', gender: 'boy', origin: 'Hebrew', meaning: '"Helper". Biblical scribe name.', rank: 23, category: 'Traditional' },
      { id: 'milo', name: 'Milo', gender: 'boy', origin: 'Germanic', meaning: '"Mild" or "peaceful". Gentle vintage choice.', rank: 24, category: 'Modern' },
      { id: 'silas', name: 'Silas', gender: 'boy', origin: 'Latin', meaning: '"Wood" or "forest". Biblical companion of Paul.', rank: 25, category: 'Traditional' },
      { id: 'arthur', name: 'Arthur', gender: 'boy', origin: 'Celtic', meaning: '"Bear". Legendary king name.', rank: 26, category: 'Classic' },
      { id: 'atticus', name: 'Atticus', gender: 'boy', origin: 'Latin', meaning: '"From Attica". Literary hero name.', rank: 27, category: 'Classic' },
      { id: 'soren', name: 'Soren', gender: 'boy', origin: 'Danish', meaning: '"Stern". Scandinavian choice.', rank: 28, category: 'Modern' },
      { id: 'ryker', name: 'Ryker', gender: 'boy', origin: 'Danish', meaning: '"Rich". Strong modern sound.', rank: 29, category: 'Modern' },
      { id: 'charlie', name: 'Charlie', gender: 'boy', origin: 'Germanic', meaning: '"Free man". Friendly unisex choice.', rank: 30, category: 'Modern' },
      { id: 'axel', name: 'Axel', gender: 'boy', origin: 'Scandinavian', meaning: '"Father of peace". Edgy modern choice.', rank: 31, category: 'Modern' },
      { id: 'declan', name: 'Declan', gender: 'boy', origin: 'Irish', meaning: '"Man of prayer". Irish saint name.', rank: 32, category: 'Traditional' },
      { id: 'sawyer', name: 'Sawyer', gender: 'boy', origin: 'English', meaning: '"Woodcutter". Literary occupational name.', rank: 33, category: 'Modern' },
      { id: 'miles', name: 'Miles', gender: 'boy', origin: 'Latin', meaning: '"Soldier". Classic with jazz connections.', rank: 34, category: 'Classic' },
      { id: 'levi', name: 'Levi', gender: 'boy', origin: 'Hebrew', meaning: '"United" or "joined". Biblical tribe name.', rank: 35, category: 'Traditional' },
      { id: 'sebastian', name: 'Sebastian', gender: 'boy', origin: 'Greek', meaning: '"Venerable". Saint and martyr name.', rank: 36, category: 'Classic' },
      { id: 'jack', name: 'Jack', gender: 'boy', origin: 'English', meaning: '"God is gracious". Timeless nickname choice.', rank: 37, category: 'Traditional' },
      { id: 'rory', name: 'Rory', gender: 'boy', origin: 'Irish', meaning: '"Red king". Spirited Irish choice.', rank: 38, category: 'Modern' },
      { id: 'kit', name: 'Kit', gender: 'boy', origin: 'English', meaning: '"Bearer of Christ". Short and sweet.', rank: 39, category: 'Modern' },
      { id: 'julian', name: 'Julian', gender: 'boy', origin: 'Latin', meaning: '"Youthful". Roman emperor name.', rank: 40, category: 'Classic' },
      { id: 'alexander', name: 'Alexander', gender: 'boy', origin: 'Greek', meaning: '"Defender of men". Great conqueror name.', rank: 41, category: 'Classic' },
      { id: 'elias', name: 'Elias', gender: 'boy', origin: 'Hebrew', meaning: '"The Lord is my God". Prophet name variation.', rank: 42, category: 'Traditional' },
      { id: 'archer', name: 'Archer', gender: 'boy', origin: 'English', meaning: '"Bowman". Occupational name.', rank: 43, category: 'Modern' },
      { id: 'hugo', name: 'Hugo', gender: 'boy', origin: 'Germanic', meaning: '"Mind" or "intellect". Literary classic.', rank: 44, category: 'Classic' },
      { id: 'owen', name: 'Owen', gender: 'boy', origin: 'Welsh', meaning: '"Noble warrior". Celtic choice.', rank: 45, category: 'Traditional' },
      { id: 'emmett', name: 'Emmett', gender: 'boy', origin: 'Germanic', meaning: '"Universal". Vintage choice.', rank: 46, category: 'Classic' },
      { id: 'orion', name: 'Orion', gender: 'boy', origin: 'Greek', meaning: '"Rising in the sky". Stellar constellation.', rank: 47, category: 'Modern' },
      { id: 'gabriel', name: 'Gabriel', gender: 'boy', origin: 'Hebrew', meaning: '"God is my strength". Archangel name.', rank: 48, category: 'Traditional' },
      { id: 'callum', name: 'Callum', gender: 'boy', origin: 'Scottish', meaning: '"Dove". Scottish choice.', rank: 49, category: 'Modern' },
      { id: 'ellis', name: 'Ellis', gender: 'boy', origin: 'Welsh', meaning: '"Benevolent". Unisex surname choice.', rank: 50, category: 'Modern' },
      
      // 2025 Top Girls Names (1-50)
      { id: 'olivia', name: 'Olivia', gender: 'girl', origin: 'Latin', meaning: '"Olive tree". Top name for 6th consecutive year.', rank: 1, category: 'Classic' },
      { id: 'emma', name: 'Emma', gender: 'girl', origin: 'Germanic', meaning: '"Whole" or "universal". Consistently popular classic.', rank: 2, category: 'Traditional' },
      { id: 'charlotte', name: 'Charlotte', gender: 'girl', origin: 'French', meaning: '"Free man". Royal favorite with enduring appeal.', rank: 3, category: 'Classic' },
      { id: 'amelia', name: 'Amelia', gender: 'girl', origin: 'Germanic', meaning: '"Work" or "industrious". Aviation pioneer inspiration.', rank: 4, category: 'Classic' },
      { id: 'sophia', name: 'Sophia', gender: 'girl', origin: 'Greek', meaning: '"Wisdom". Elegant name with timeless appeal.', rank: 5, category: 'Classic' },
      { id: 'isabella', name: 'Isabella', gender: 'girl', origin: 'Hebrew', meaning: '"God is my oath". Romantic and sophisticated.', rank: 6, category: 'Classic' },
      { id: 'ava', name: 'Ava', gender: 'girl', origin: 'Latin', meaning: '"Life" or "bird". Short and sweet with star appeal.', rank: 7, category: 'Modern' },
      { id: 'mia', name: 'Mia', gender: 'girl', origin: 'Scandinavian', meaning: '"Mine" or "bitter". Short international choice.', rank: 8, category: 'Modern' },
      { id: 'luna', name: 'Luna', gender: 'girl', origin: 'Latin', meaning: '"Moon". Celestial name rising in popularity.', rank: 9, category: 'Modern' },
      { id: 'grace', name: 'Grace', gender: 'girl', origin: 'Latin', meaning: '"Charm" or "blessing". Virtue name with elegance.', rank: 10, category: 'Traditional' },
      { id: 'lily', name: 'Lily', gender: 'girl', origin: 'Latin', meaning: '"Pure". Floral name symbolizing purity.', rank: 11, category: 'Traditional' },
      { id: 'hazel', name: 'Hazel', gender: 'girl', origin: 'English', meaning: '"Hazelnut tree". Nature name with vintage charm.', rank: 12, category: 'Modern' },
      { id: 'iris', name: 'Iris', gender: 'girl', origin: 'Greek', meaning: '"Rainbow". Goddess of the rainbow.', rank: 13, category: 'Classic' },
      { id: 'chloe', name: 'Chloe', gender: 'girl', origin: 'Greek', meaning: '"Young green shoot". Fresh springtime name.', rank: 14, category: 'Modern' },
      { id: 'ruby', name: 'Ruby', gender: 'girl', origin: 'Latin', meaning: '"Deep red precious stone". Gemstone name.', rank: 15, category: 'Classic' },
      { id: 'maeve', name: 'Maeve', gender: 'girl', origin: 'Irish', meaning: '"Intoxicating". Irish queen name.', rank: 16, category: 'Modern' },
      { id: 'evelyn', name: 'Evelyn', gender: 'girl', origin: 'English', meaning: '"Wished for child". Vintage comeback name.', rank: 17, category: 'Classic' },
      { id: 'nova', name: 'Nova', gender: 'girl', origin: 'Latin', meaning: '"New". Astronomical phenomenon name.', rank: 18, category: 'Modern' },
      { id: 'violet', name: 'Violet', gender: 'girl', origin: 'Latin', meaning: '"Purple flower". Floral name with literary connections.', rank: 19, category: 'Classic' },
      { id: 'ivy', name: 'Ivy', gender: 'girl', origin: 'English', meaning: '"Climbing vine". Nature name suggesting fidelity.', rank: 20, category: 'Modern' },
      { id: 'aurelia', name: 'Aurelia', gender: 'girl', origin: 'Latin', meaning: '"Golden". Roman name with luminous meaning.', rank: 21, category: 'Classic' },
      { id: 'nora', name: 'Nora', gender: 'girl', origin: 'Irish', meaning: '"Light". Short and sweet international choice.', rank: 22, category: 'Modern' },
      { id: 'clementine', name: 'Clementine', gender: 'girl', origin: 'Latin', meaning: '"Mild" or "merciful". Fruit name with vintage charm.', rank: 23, category: 'Classic' },
      { id: 'lucy', name: 'Lucy', gender: 'girl', origin: 'Latin', meaning: '"Light". Classic with Lucy in the Sky connection.', rank: 24, category: 'Traditional' },
      { id: 'ophelia', name: 'Ophelia', gender: 'girl', origin: 'Greek', meaning: '"Help". Shakespearean heroine name.', rank: 25, category: 'Classic' },
      { id: 'sage', name: 'Sage', gender: 'girl', origin: 'Latin', meaning: '"Wise one". Herb name suggesting wisdom.', rank: 26, category: 'Modern' },
      { id: 'florence', name: 'Florence', gender: 'girl', origin: 'Latin', meaning: '"Flourishing". City name with historical significance.', rank: 27, category: 'Classic' },
      { id: 'wren', name: 'Wren', gender: 'girl', origin: 'English', meaning: '"Small bird". Nature name with architectural connections.', rank: 28, category: 'Modern' },
      { id: 'margot', name: 'Margot', gender: 'girl', origin: 'French', meaning: '"Pearl". Chic French choice.', rank: 29, category: 'Classic' },
      { id: 'willow', name: 'Willow', gender: 'girl', origin: 'English', meaning: '"Graceful tree". Nature name suggesting flexibility.', rank: 30, category: 'Modern' },
      { id: 'elowen', name: 'Elowen', gender: 'girl', origin: 'Cornish', meaning: '"Elm tree". Unique Celtic nature name.', rank: 31, category: 'Modern' },
      { id: 'daisy', name: 'Daisy', gender: 'girl', origin: 'English', meaning: '"Day\'s eye". Fresh flower name.', rank: 32, category: 'Traditional' },
      { id: 'evangeline', name: 'Evangeline', gender: 'girl', origin: 'Greek', meaning: '"Bearer of good news". Literary romantic name.', rank: 33, category: 'Classic' },
      { id: 'juniper', name: 'Juniper', gender: 'girl', origin: 'Latin', meaning: '"Young". Botanical name with gin connections.', rank: 34, category: 'Modern' },
      { id: 'rose', name: 'Rose', gender: 'girl', origin: 'Latin', meaning: '"Rose flower". Classic floral symbol of love.', rank: 35, category: 'Traditional' },
      { id: 'phoebe', name: 'Phoebe', gender: 'girl', origin: 'Greek', meaning: '"Bright" or "shining". Mythological moon goddess.', rank: 36, category: 'Classic' },
      { id: 'adelaide', name: 'Adelaide', gender: 'girl', origin: 'Germanic', meaning: '"Noble natured". Regal city name.', rank: 37, category: 'Classic' },
      { id: 'cordelia', name: 'Cordelia', gender: 'girl', origin: 'Celtic', meaning: '"Heart" or "daughter of the sea". Shakespearean choice.', rank: 38, category: 'Classic' },
      { id: 'elsie', name: 'Elsie', gender: 'girl', origin: 'Scottish', meaning: '"Pledged to God". Vintage nickname choice.', rank: 39, category: 'Classic' },
      { id: 'mae', name: 'Mae', gender: 'girl', origin: 'English', meaning: '"Bitter" or "drop of the sea". Short and sweet vintage choice.', rank: 40, category: 'Classic' },
      { id: 'penelope', name: 'Penelope', gender: 'girl', origin: 'Greek', meaning: '"Weaver". Odysseus\' faithful wife.', rank: 41, category: 'Classic' },
      { id: 'flora', name: 'Flora', gender: 'girl', origin: 'Latin', meaning: '"Flower". Roman goddess of flowers.', rank: 42, category: 'Classic' },
      { id: 'josephine', name: 'Josephine', gender: 'girl', origin: 'Hebrew', meaning: '"God will increase". Napoleon\'s empress name.', rank: 43, category: 'Classic' },
      { id: 'matilda', name: 'Matilda', gender: 'girl', origin: 'Germanic', meaning: '"Mighty in battle". Literary heroine name.', rank: 44, category: 'Classic' },
      { id: 'sylvie', name: 'Sylvie', gender: 'girl', origin: 'French', meaning: '"From the forest". French nature name.', rank: 45, category: 'Modern' },
      { id: 'june', name: 'June', gender: 'girl', origin: 'Latin', meaning: '"Young". Month name with summery appeal.', rank: 46, category: 'Traditional' },
      { id: 'genevieve', name: 'Genevieve', gender: 'girl', origin: 'Celtic', meaning: '"Tribe woman". Patron saint of Paris.', rank: 47, category: 'Classic' },
      { id: 'avery', name: 'Avery', gender: 'girl', origin: 'English', meaning: '"Elf ruler". Unisex surname choice.', rank: 48, category: 'Modern' },
      { id: 'quinn', name: 'Quinn', gender: 'girl', origin: 'Irish', meaning: '"Descendant of Conn". Strong unisex choice.', rank: 49, category: 'Modern' },
      { id: 'adeline', name: 'Adeline', gender: 'girl', origin: 'Germanic', meaning: '"Noble" or "nobility". Sweet vintage choice.', rank: 50, category: 'Classic' }
    ];

    // Additional trending and historical names from 2021-2024
    const additionalNames: BabyName[] = [
      // More 2025 trending boys names
      { id: 'beau', name: 'Beau', gender: 'boy', origin: 'French', meaning: '"Handsome". French word with southern charm.', rank: 51, category: 'Modern' },
      { id: 'logan', name: 'Logan', gender: 'boy', origin: 'Scottish', meaning: '"Little hollow". Strong Scottish surname.', rank: 52, category: 'Modern' },
      { id: 'isaac', name: 'Isaac', gender: 'boy', origin: 'Hebrew', meaning: '"Laughter". Biblical patriarch name.', rank: 53, category: 'Traditional' },
      { id: 'wyatt', name: 'Wyatt', gender: 'boy', origin: 'English', meaning: '"Brave in war". Wild West sheriff name.', rank: 54, category: 'Modern' },
      { id: 'luke', name: 'Luke', gender: 'boy', origin: 'Greek', meaning: '"Light-giving". Gospel writer name.', rank: 55, category: 'Traditional' },
      { id: 'micah', name: 'Micah', gender: 'boy', origin: 'Hebrew', meaning: '"Who is like God?". Biblical prophet name.', rank: 56, category: 'Traditional' },
      { id: 'ronan', name: 'Ronan', gender: 'boy', origin: 'Irish', meaning: '"Little seal". Irish saint name.', rank: 57, category: 'Modern' },
      { id: 'wilder', name: 'Wilder', gender: 'boy', origin: 'English', meaning: '"Untamed". Nature-inspired surname.', rank: 58, category: 'Modern' },
      { id: 'brooks', name: 'Brooks', gender: 'boy', origin: 'English', meaning: '"Of the brook". Nature surname choice.', rank: 59, category: 'Modern' },
      { id: 'hudson', name: 'Hudson', gender: 'boy', origin: 'English', meaning: '"Hugh\'s son". River and explorer name.', rank: 60, category: 'Modern' },
      { id: 'thomas', name: 'Thomas', gender: 'boy', origin: 'Aramaic', meaning: '"Twin". Apostle and saint name.', rank: 61, category: 'Traditional' },
      { id: 'ethan', name: 'Ethan', gender: 'boy', origin: 'Hebrew', meaning: '"Firm" or "steadfast". Strong biblical choice.', rank: 62, category: 'Traditional' },
      { id: 'wesley', name: 'Wesley', gender: 'boy', origin: 'English', meaning: '"Western meadow". Methodist founder name.', rank: 63, category: 'Traditional' },
      { id: 'roman', name: 'Roman', gender: 'boy', origin: 'Latin', meaning: '"Citizen of Rome". Strong historical choice.', rank: 64, category: 'Classic' },
      { id: 'william', name: 'William', gender: 'boy', origin: 'Germanic', meaning: '"Resolute protector". Royal name with staying power.', rank: 65, category: 'Traditional' },
      
      // More 2025 trending girls names
      { id: 'cora', name: 'Cora', gender: 'girl', origin: 'Greek', meaning: '"Maiden". Mythological choice with vintage appeal.', rank: 51, category: 'Classic' },
      { id: 'eden', name: 'Eden', gender: 'girl', origin: 'Hebrew', meaning: '"Paradise". Biblical garden name.', rank: 52, category: 'Modern' },
      { id: 'audrey', name: 'Audrey', gender: 'girl', origin: 'English', meaning: '"Noble strength". Hollywood icon name.', rank: 53, category: 'Classic' },
      { id: 'mabel', name: 'Mabel', gender: 'girl', origin: 'Latin', meaning: '"Lovable". Vintage choice making comeback.', rank: 54, category: 'Classic' },
      { id: 'maisie', name: 'Maisie', gender: 'girl', origin: 'Scottish', meaning: '"Pearl". Scottish nickname with spunk.', rank: 55, category: 'Modern' },
      { id: 'astrid', name: 'Astrid', gender: 'girl', origin: 'Scandinavian', meaning: '"Divine star". Strong Scandinavian choice.', rank: 56, category: 'Modern' },
      { id: 'olive', name: 'Olive', gender: 'girl', origin: 'Latin', meaning: '"Olive tree". Nature name symbolizing peace.', rank: 57, category: 'Modern' },
      { id: 'beatrice', name: 'Beatrice', gender: 'girl', origin: 'Latin', meaning: '"She who brings happiness". Literary classic.', rank: 58, category: 'Classic' },
      { id: 'jane', name: 'Jane', gender: 'girl', origin: 'English', meaning: '"God is gracious". Simple classic with literary connections.', rank: 59, category: 'Traditional' },
      { id: 'scarlett', name: 'Scarlett', gender: 'girl', origin: 'English', meaning: '"Red". Color name with literary fame.', rank: 60, category: 'Modern' },
      { id: 'stella', name: 'Stella', gender: 'girl', origin: 'Latin', meaning: '"Star". Celestial name with vintage charm.', rank: 61, category: 'Classic' },
      { id: 'imogen', name: 'Imogen', gender: 'girl', origin: 'Celtic', meaning: '"Maiden". Shakespearean choice.', rank: 62, category: 'Classic' },
      { id: 'poppy', name: 'Poppy', gender: 'girl', origin: 'Latin', meaning: '"Red flower". Bright floral choice.', rank: 63, category: 'Modern' },
      { id: 'sadie', name: 'Sadie', gender: 'girl', origin: 'Hebrew', meaning: '"Princess". Vintage nickname choice.', rank: 64, category: 'Classic' },
      { id: 'thea', name: 'Thea', gender: 'girl', origin: 'Greek', meaning: '"Goddess". Short mythological choice.', rank: 65, category: 'Modern' },
      { id: 'harper', name: 'Harper', gender: 'girl', origin: 'English', meaning: '"Harp player". Occupational name with musical connections.', rank: 66, category: 'Modern' },
      { id: 'aria', name: 'Aria', gender: 'girl', origin: 'Italian', meaning: '"Air" or "song". Musical term as name.', rank: 67, category: 'Modern' },
      { id: 'delilah', name: 'Delilah', gender: 'girl', origin: 'Hebrew', meaning: '"Delicate". Biblical name with musical connections.', rank: 68, category: 'Classic' },
      { id: 'elizabeth', name: 'Elizabeth', gender: 'girl', origin: 'Hebrew', meaning: '"God is my oath". Royal classic with endless nicknames.', rank: 69, category: 'Traditional' },
      { id: 'claire', name: 'Claire', gender: 'girl', origin: 'French', meaning: '"Clear" or "bright". Simple French elegance.', rank: 70, category: 'Classic' },
      
      // Historical favorites from 2021-2024
      { id: 'jackson', name: 'Jackson', gender: 'boy', origin: 'English', meaning: '"Son of Jack". Presidential surname choice.', rank: 71, category: 'Modern' },
      { id: 'aiden', name: 'Aiden', gender: 'boy', origin: 'Irish', meaning: '"Little fire". Irish saint name.', rank: 72, category: 'Modern' },
      { id: 'samuel', name: 'Samuel', gender: 'boy', origin: 'Hebrew', meaning: '"Heard by God". Biblical prophet name.', rank: 73, category: 'Traditional' },
      { id: 'david', name: 'David', gender: 'boy', origin: 'Hebrew', meaning: '"Beloved". Biblical king name.', rank: 74, category: 'Traditional' },
      { id: 'joseph', name: 'Joseph', gender: 'boy', origin: 'Hebrew', meaning: '"God will increase". Biblical patriarch name.', rank: 75, category: 'Traditional' },
      { id: 'john', name: 'John', gender: 'boy', origin: 'Hebrew', meaning: '"God is gracious". Timeless classic.', rank: 76, category: 'Traditional' },
      { id: 'anthony', name: 'Anthony', gender: 'boy', origin: 'Latin', meaning: '"Priceless one". Roman name with saint connections.', rank: 77, category: 'Classic' },
      { id: 'andrew', name: 'Andrew', gender: 'boy', origin: 'Greek', meaning: '"Manly". Apostle name.', rank: 78, category: 'Traditional' },
      { id: 'joshua', name: 'Joshua', gender: 'boy', origin: 'Hebrew', meaning: '"God is salvation". Biblical leader name.', rank: 79, category: 'Traditional' },
      { id: 'nathan', name: 'Nathan', gender: 'boy', origin: 'Hebrew', meaning: '"Given". Biblical prophet name.', rank: 80, category: 'Traditional' },
      
      { id: 'abigail', name: 'Abigail', gender: 'girl', origin: 'Hebrew', meaning: '"Father\'s joy". Biblical name with presidential connections.', rank: 71, category: 'Traditional' },
      { id: 'emily', name: 'Emily', gender: 'girl', origin: 'Latin', meaning: '"Rival". Poet name with enduring appeal.', rank: 72, category: 'Classic' },
      { id: 'ella', name: 'Ella', gender: 'girl', origin: 'Germanic', meaning: '"All" or "fairy maiden". Jazz legend name.', rank: 73, category: 'Modern' },
      { id: 'madison', name: 'Madison', gender: 'girl', origin: 'English', meaning: '"Son of Matthew". Presidential surname.', rank: 74, category: 'Modern' },
      { id: 'victoria', name: 'Victoria', gender: 'girl', origin: 'Latin', meaning: '"Victory". Royal name with triumphant meaning.', rank: 75, category: 'Classic' },
      { id: 'sarah', name: 'Sarah', gender: 'girl', origin: 'Hebrew', meaning: '"Princess". Biblical matriarch name.', rank: 76, category: 'Traditional' },
      { id: 'natalie', name: 'Natalie', gender: 'girl', origin: 'Latin', meaning: '"Christmas Day". Holiday-themed classic.', rank: 77, category: 'Classic' },
      { id: 'hannah', name: 'Hannah', gender: 'girl', origin: 'Hebrew', meaning: '"Grace". Palindromic biblical name.', rank: 78, category: 'Traditional' },
      { id: 'chloe_alt', name: 'Chloe', gender: 'girl', origin: 'Greek', meaning: '"Young green shoot". Spring goddess name.', rank: 79, category: 'Modern' },
      { id: 'samantha', name: 'Samantha', gender: 'girl', origin: 'Hebrew', meaning: '"Listener". Modern invention with classic feel.', rank: 80, category: 'Modern' }
    ];
    
    const allNames = [...names, ...additionalNames];
    for (const name of allNames) {
      this.babyNames.set(name.id, name);
    }
  }
}

export const storage = new MemStorage();
