import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["worker", "restaurant"]);
export const promotionStatusEnum = pgEnum("promotion_status", ["draft", "active", "scheduled", "paused", "expired"]);
export const workerRoleEnum = pgEnum("worker_role", ["server", "bartender", "chef", "host", "manager", "other"]);

// Users table - stores authentication and basic profile info
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Worker profiles
export const workerProfiles = pgTable("worker_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  workerRole: workerRoleEnum("worker_role").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Restaurant profiles
export const restaurantProfiles = pgTable("restaurant_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Promotions
export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurantProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  discountType: text("discount_type").notNull(), // percentage, fixed, bogo
  discountValue: text("discount_value").notNull(),
  status: promotionStatusEnum("status").default("draft").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  maxClaims: integer("max_claims"),
  currentClaims: integer("current_claims").default(0).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Claims - when a worker claims a promotion
export const claims = pgTable("claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promotionId: varchar("promotion_id").notNull().references(() => promotions.id, { onDelete: "cascade" }),
  workerId: varchar("worker_id").notNull().references(() => workerProfiles.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRedeemed: boolean("is_redeemed").default(false).notNull(),
});

// Redemptions - when a claimed promotion is actually used
export const redemptions = pgTable("redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertWorkerProfileSchema = createInsertSchema(workerProfiles).omit({ id: true, createdAt: true });
export const insertRestaurantProfileSchema = createInsertSchema(restaurantProfiles).omit({ id: true, createdAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  currentClaims: true, 
  impressions: true 
});
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, claimedAt: true });
export const insertRedemptionSchema = createInsertSchema(redemptions).omit({ id: true, redeemedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WorkerProfile = typeof workerProfiles.$inferSelect;
export type InsertWorkerProfile = z.infer<typeof insertWorkerProfileSchema>;

export type RestaurantProfile = typeof restaurantProfiles.$inferSelect;
export type InsertRestaurantProfile = z.infer<typeof insertRestaurantProfileSchema>;

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = z.infer<typeof insertClaimSchema>;

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;
