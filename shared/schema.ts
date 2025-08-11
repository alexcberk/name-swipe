import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  preferences: jsonb("preferences"),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  shareCode: varchar("share_code").unique(),
});

export const swipeActions = pgTable("swipe_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id"),
  nameId: varchar("name_id").notNull(),
  action: varchar("action").notNull(), // 'like' | 'dislike'
  isGlobal: boolean("is_global").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSessions = pgTable("user_sessions", {
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  role: varchar("role").notNull(), // 'owner' | 'partner'
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertSwipeActionSchema = createInsertSchema(swipeActions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  joinedAt: true,
});

export const insertBabyNameSchema = createInsertSchema(babyNames);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SwipeAction = typeof swipeActions.$inferSelect;
export type InsertSwipeAction = z.infer<typeof insertSwipeActionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type BabyName = typeof babyNames.$inferSelect;
export type InsertBabyName = z.infer<typeof insertBabyNameSchema>;

export const genderFilterSchema = z.enum(['all', 'boy', 'girl']);
export type GenderFilter = z.infer<typeof genderFilterSchema>;

export const swipeActionTypeSchema = z.enum(['like', 'dislike']);
export type SwipeActionType = z.infer<typeof swipeActionTypeSchema>;

export const userSessionRoleSchema = z.enum(['owner', 'partner']);
export type UserSessionRole = z.infer<typeof userSessionRoleSchema>;
