import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Client } from "pg";

export function createDatabaseConnection(databaseUrl: string) {
  // Detect if this is a Neon cloud URL or local PostgreSQL
  if (databaseUrl.includes('neon.tech') || databaseUrl.includes('.pooler.supabase.com')) {
    // Use Neon HTTP driver for cloud connections
    console.log('Using Neon HTTP driver for cloud database');
    const sql = neon(databaseUrl);
    return drizzle(sql);
  } else {
    // Use standard PostgreSQL driver for local connections
    console.log('Using PostgreSQL driver for local database');
    const client = new Client({ connectionString: databaseUrl });
    client.connect();
    return drizzleNode(client);
  }
}