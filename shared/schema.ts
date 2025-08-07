import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const swipeActions = pgTable("swipe_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  nameId: varchar("name_id").notNull(),
  action: varchar("action").notNull(), // 'like' | 'dislike'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const babyNames = pgTable("baby_names", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  gender: varchar("gender").notNull(), // 'boy' | 'girl' | 'unisex'
  origin: text("origin").notNull(),
  meaning: text("meaning").notNull(),
  rank: integer("rank"),
  category: varchar("category").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertSwipeActionSchema = createInsertSchema(swipeActions).omit({
  id: true,
  createdAt: true,
});

export const insertBabyNameSchema = createInsertSchema(babyNames);

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SwipeAction = typeof swipeActions.$inferSelect;
export type InsertSwipeAction = z.infer<typeof insertSwipeActionSchema>;
export type BabyName = typeof babyNames.$inferSelect;
export type InsertBabyName = z.infer<typeof insertBabyNameSchema>;

export const genderFilterSchema = z.enum(['all', 'boy', 'girl']);
export type GenderFilter = z.infer<typeof genderFilterSchema>;

export const swipeActionTypeSchema = z.enum(['like', 'dislike']);
export type SwipeActionType = z.infer<typeof swipeActionTypeSchema>;
