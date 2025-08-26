import { createDatabaseConnection } from "../server/database";
import { babyNames } from "../shared/schema";
import { babyNamesDatabase } from "../client/src/lib/baby-names";

async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  
  console.log("Connecting to database...");
  const db = createDatabaseConnection(databaseUrl);
  
  try {
    // Check if baby names exist
    const existing = await db.select().from(babyNames).limit(1);
    if (existing.length > 0) {
      console.log(`Baby names already initialized: ${existing.length} found`);
      return;
    }
    
    console.log(`Initializing ${babyNamesDatabase.length} baby names...`);
    
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < babyNamesDatabase.length; i += batchSize) {
      const batch = babyNamesDatabase.slice(i, i + batchSize);
      const namesToInsert = batch.map(name => ({
        id: name.id,
        name: name.name,
        gender: name.gender,
        origin: name.origin,
        meaning: name.meaning,
        rank: name.rank || null,
        category: name.category,
      }));
      
      await db.insert(babyNames).values(namesToInsert);
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(babyNamesDatabase.length/batchSize)}`);
    }
    
    console.log("✅ Baby names initialized successfully!");
  } catch (error) {
    console.error("Error initializing baby names:", error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();