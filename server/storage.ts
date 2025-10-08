// Re-export the Supabase storage implementation
export type { IStorage } from "./storage-supabase";
export { SupabaseStorage as DbStorage, storage } from "./storage-supabase";

// Legacy Drizzle implementation (kept for reference, not used)
/*
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  type User,
  type InsertUser,
  type WorkerProfile,
  type InsertWorkerProfile,
  type RestaurantProfile,
  type InsertRestaurantProfile,
  type Promotion,
  type InsertPromotion,
  type Claim,
  type InsertClaim,
  type Redemption,
  type InsertRedemption,
  users,
  workerProfiles,
  restaurantProfiles,
  promotions,
  claims,
  redemptions,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Worker profile operations
  getWorkerProfile(userId: string): Promise<WorkerProfile | undefined>;
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;

  // Restaurant profile operations
  getRestaurantProfile(userId: string): Promise<RestaurantProfile | undefined>;
  createRestaurantProfile(profile: InsertRestaurantProfile): Promise<RestaurantProfile>;

  // Promotion operations
  getPromotion(id: string): Promise<Promotion | undefined>;
  getActivePromotions(): Promise<any[]>;
  getRestaurantPromotions(restaurantId: string): Promise<any[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion | undefined>;
  incrementPromotionImpressions(id: string): Promise<void>;

  // Claim operations
  getClaim(id: string): Promise<Claim | undefined>;
  getClaimByCode(code: string): Promise<Claim | undefined>;
  getWorkerClaims(workerId: string): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, claim: Partial<Claim>): Promise<Claim | undefined>;

  // Redemption operations
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  getPromotionRedemptionCount(promotionId: string): Promise<number>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Worker profile operations
  async getWorkerProfile(userId: string): Promise<WorkerProfile | undefined> {
    const result = await db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, userId))
      .limit(1);
    return result[0];
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const result = await db.insert(workerProfiles).values(profile).returning();
    return result[0];
  }

  // Restaurant profile operations
  async getRestaurantProfile(userId: string): Promise<RestaurantProfile | undefined> {
    const result = await db
      .select()
      .from(restaurantProfiles)
      .where(eq(restaurantProfiles.userId, userId))
      .limit(1);
    return result[0];
  }

  async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<RestaurantProfile> {
    const result = await db.insert(restaurantProfiles).values(profile).returning();
    return result[0];
  }

  // Promotion operations
  async getPromotion(id: string): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
    return result[0];
  }

  async getActivePromotions(): Promise<any[]> {
    const result = await db
      .select({
        id: promotions.id,
        restaurantId: promotions.restaurantId,
        title: promotions.title,
        description: promotions.description,
        imageUrl: promotions.imageUrl,
        discountType: promotions.discountType,
        discountValue: promotions.discountValue,
        status: promotions.status,
        startDate: promotions.startDate,
        endDate: promotions.endDate,
        maxClaims: promotions.maxClaims,
        currentClaims: promotions.currentClaims,
        impressions: promotions.impressions,
        createdAt: promotions.createdAt,
        updatedAt: promotions.updatedAt,
        restaurantName: restaurantProfiles.name,
        restaurantAddress: restaurantProfiles.address,
        restaurantLogoUrl: restaurantProfiles.logoUrl,
      })
      .from(promotions)
      .leftJoin(restaurantProfiles, eq(promotions.restaurantId, restaurantProfiles.id))
      .where(eq(promotions.status, "active"))
      .orderBy(desc(promotions.createdAt));
    
    return result;
  }

  async getRestaurantPromotions(restaurantId: string): Promise<any[]> {
    const promos = await db
      .select({
        id: promotions.id,
        restaurantId: promotions.restaurantId,
        title: promotions.title,
        description: promotions.description,
        imageUrl: promotions.imageUrl,
        discountType: promotions.discountType,
        discountValue: promotions.discountValue,
        status: promotions.status,
        startDate: promotions.startDate,
        endDate: promotions.endDate,
        maxClaims: promotions.maxClaims,
        currentClaims: promotions.currentClaims,
        impressions: promotions.impressions,
        createdAt: promotions.createdAt,
        updatedAt: promotions.updatedAt,
      })
      .from(promotions)
      .where(eq(promotions.restaurantId, restaurantId))
      .orderBy(desc(promotions.createdAt));
    
    // Add redemption counts to each promotion
    const result = await Promise.all(
      promos.map(async (promo) => ({
        ...promo,
        redemptions: await this.getPromotionRedemptionCount(promo.id),
      }))
    );
    
    return result;
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const result = await db.insert(promotions).values(promotion).returning();
    return result[0];
  }

  async updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion | undefined> {
    const result = await db
      .update(promotions)
      .set({ ...promotion, updatedAt: new Date() })
      .where(eq(promotions.id, id))
      .returning();
    return result[0];
  }

  async incrementPromotionImpressions(id: string): Promise<void> {
    const promotion = await this.getPromotion(id);
    if (promotion) {
      await db
        .update(promotions)
        .set({ impressions: (promotion.impressions || 0) + 1 })
        .where(eq(promotions.id, id));
    }
  }

  // Claim operations
  async getClaim(id: string): Promise<Claim | undefined> {
    const result = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
    return result[0];
  }

  async getClaimByCode(code: string): Promise<Claim | undefined> {
    const result = await db.select().from(claims).where(eq(claims.code, code)).limit(1);
    return result[0];
  }

  async getWorkerClaims(workerId: string): Promise<Claim[]> {
    return await db
      .select()
      .from(claims)
      .where(eq(claims.workerId, workerId))
      .orderBy(desc(claims.claimedAt));
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const result = await db.insert(claims).values(claim).returning();
    
    // Increment promotion claims count
    const promotion = await this.getPromotion(claim.promotionId);
    if (promotion) {
      await this.updatePromotion(claim.promotionId, {
        currentClaims: (promotion.currentClaims || 0) + 1,
      });
    }
    
    return result[0];
  }

  async updateClaim(id: string, claim: Partial<Claim>): Promise<Claim | undefined> {
    const result = await db
      .update(claims)
      .set(claim)
      .where(eq(claims.id, id))
      .returning();
    return result[0];
  }

  // Redemption operations
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const result = await db.insert(redemptions).values(redemption).returning();
    
    // Mark claim as redeemed
    await this.updateClaim(redemption.claimId, { isRedeemed: true });
    
    return result[0];
  }

  async getPromotionRedemptionCount(promotionId: string): Promise<number> {
    const result = await db
      .select()
      .from(redemptions)
      .leftJoin(claims, eq(redemptions.claimId, claims.id))
      .where(eq(claims.promotionId, promotionId));
    
    return result.length;
  }
}

export const storage = new DbStorage();
*/
