import { supabase } from "./supabase";
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

export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  // Worker profile operations
  async getWorkerProfile(userId: string): Promise<WorkerProfile | undefined> {
    const { data, error } = await supabase
      .from('worker_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as WorkerProfile;
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const { data, error } = await supabase
      .from('worker_profiles')
      .insert({
        user_id: profile.userId,
        name: profile.name,
        worker_role: profile.workerRole,
        is_verified: profile.isVerified
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as WorkerProfile;
  }

  // Restaurant profile operations
  async getRestaurantProfile(userId: string): Promise<RestaurantProfile | undefined> {
    const { data, error } = await supabase
      .from('restaurant_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as RestaurantProfile;
  }

  async createRestaurantProfile(profile: InsertRestaurantProfile): Promise<RestaurantProfile> {
    const { data, error } = await supabase
      .from('restaurant_profiles')
      .insert({
        user_id: profile.userId,
        name: profile.name,
        address: profile.address,
        logo_url: profile.logoUrl
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as RestaurantProfile;
  }

  // Promotion operations
  async getPromotion(id: string): Promise<Promotion | undefined> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Promotion;
  }

  async getActivePromotions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select(`
        *,
        restaurant_profiles!inner (
          name,
          address,
          logo_url
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(promo => ({
      ...promo,
      restaurantName: promo.restaurant_profiles?.name,
      restaurantAddress: promo.restaurant_profiles?.address,
      restaurantLogoUrl: promo.restaurant_profiles?.logo_url
    }));
  }

  async getRestaurantPromotions(restaurantId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const promos = data || [];
    const result = await Promise.all(
      promos.map(async (promo) => ({
        ...promo,
        redemptions: await this.getPromotionRedemptionCount(promo.id),
      }))
    );
    
    return result;
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        restaurant_id: promotion.restaurantId,
        title: promotion.title,
        description: promotion.description,
        image_url: promotion.imageUrl,
        discount_type: promotion.discountType,
        discount_value: promotion.discountValue,
        start_date: promotion.startDate,
        end_date: promotion.endDate,
        max_claims: promotion.maxClaims,
        status: promotion.status || 'draft'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Promotion;
  }

  async updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion | undefined> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (promotion.title !== undefined) updateData.title = promotion.title;
    if (promotion.description !== undefined) updateData.description = promotion.description;
    if (promotion.imageUrl !== undefined) updateData.image_url = promotion.imageUrl;
    if (promotion.discountType !== undefined) updateData.discount_type = promotion.discountType;
    if (promotion.discountValue !== undefined) updateData.discount_value = promotion.discountValue;
    if (promotion.startDate !== undefined) updateData.start_date = promotion.startDate;
    if (promotion.endDate !== undefined) updateData.end_date = promotion.endDate;
    if (promotion.maxClaims !== undefined) updateData.max_claims = promotion.maxClaims;
    if (promotion.currentClaims !== undefined) updateData.current_claims = promotion.currentClaims;
    if (promotion.status !== undefined) updateData.status = promotion.status;
    if (promotion.impressions !== undefined) updateData.impressions = promotion.impressions;

    const { data, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Promotion;
  }

  async incrementPromotionImpressions(id: string): Promise<void> {
    const promotion = await this.getPromotion(id);
    if (promotion) {
      await supabase
        .from('promotions')
        .update({ impressions: (promotion.impressions || 0) + 1 })
        .eq('id', id);
    }
  }

  // Claim operations
  async getClaim(id: string): Promise<Claim | undefined> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Claim;
  }

  async getClaimByCode(code: string): Promise<Claim | undefined> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Claim;
  }

  async getWorkerClaims(workerId: string): Promise<Claim[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('worker_id', workerId)
      .order('claimed_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Claim[];
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const { data, error } = await supabase
      .from('claims')
      .insert({
        worker_id: claim.workerId,
        promotion_id: claim.promotionId,
        code: claim.code,
        expires_at: claim.expiresAt,
        is_redeemed: claim.isRedeemed || false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment promotion claims count
    const promotion = await this.getPromotion(claim.promotionId);
    if (promotion) {
      await this.updatePromotion(claim.promotionId, {
        currentClaims: (promotion.currentClaims || 0) + 1,
      });
    }
    
    return data as Claim;
  }

  async updateClaim(id: string, claim: Partial<Claim>): Promise<Claim | undefined> {
    const updateData: any = {};
    if (claim.isRedeemed !== undefined) updateData.is_redeemed = claim.isRedeemed;
    if (claim.code !== undefined) updateData.code = claim.code;
    if (claim.expiresAt !== undefined) updateData.expires_at = claim.expiresAt;

    const { data, error } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Claim;
  }

  // Redemption operations
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const { data, error } = await supabase
      .from('redemptions')
      .insert({
        claim_id: redemption.claimId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Mark claim as redeemed
    await this.updateClaim(redemption.claimId, { isRedeemed: true });
    
    return data as Redemption;
  }

  async getPromotionRedemptionCount(promotionId: string): Promise<number> {
    const { data, error } = await supabase
      .from('redemptions')
      .select('claim_id, claims!inner(promotion_id)')
      .eq('claims.promotion_id', promotionId);
    
    if (error) throw error;
    return (data || []).length;
  }
}

export const storage = new SupabaseStorage();
