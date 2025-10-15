import { supabase } from "./supabase";
import {
  type User,
  type InsertUser,
  type WorkerProfile,
  type InsertWorkerProfile,
  type RestaurantProfile,
  type InsertRestaurantProfile,
  type Organization,
  type InsertOrganization,
  type Promotion,
  type InsertPromotion,
  type Redemption,
  type InsertRedemption,
  type Claim,
  type InsertClaim,
  type AuditLog,
  type InsertAuditLog,
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

  // Organization operations (admin only)
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<Organization>): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  getNeighborhoods(): Promise<any[]>;
  updateProfileOrgId(profileId: string, orgId: string, profileType: 'worker' | 'restaurant'): Promise<void>;

  // Promotion operations
  getPromotion(id: string): Promise<Promotion | undefined>;
  getActivePromotions(): Promise<any[]>;
  getRestaurantPromotions(restaurantId: string): Promise<any[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion | undefined>;

  // Redemption operations
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  getPromotionRedemptionCount(promotionId: string): Promise<number>;
  getWorkerRedemptions(workerProfileId: string): Promise<Redemption[]>;

  // Claim operations
  getClaim(id: string): Promise<Claim | undefined>;
  getClaimByCode(code: string): Promise<Claim | undefined>;
  getWorkerClaims(workerId: string): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaim(id: string, claim: Partial<Claim>): Promise<Claim | undefined>;

  // Admin operations
  getAllUsers(limit?: number, offset?: number): Promise<{ users: User[]; total: number }>;
  searchUsers(query: string): Promise<User[]>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getUserWithProfile(id: string): Promise<any>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number): Promise<{ logs: AuditLog[]; total: number }>;
  getDashboardMetrics(): Promise<any>;
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
      if (error.code === 'PGRST116') return undefined;
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
      if (error.code === 'PGRST116') return undefined;
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
        worker_role: profile.position,
        is_verified: profile.isVerified || false
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
        address: profile.address || null,
        logo_url: profile.logoUrl || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as RestaurantProfile;
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Organization;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: org.name,
        address: org.address || null,
        neighborhood_id: org.neighborhoodId || null,
        lat: org.lat || null,
        lng: org.lng || null,
        staff_min: org.staffMin || null,
        staff_max: org.staffMax || null,
        logo_url: org.logoUrl || null,
        subscription_status: org.subscriptionStatus || 'active',
        subscription_plan_id: org.subscriptionPlanId || null,
        stripe_customer_id: org.stripeCustomerId || null,
        stripe_subscription_id: org.stripeSubscriptionId || null,
        trial_ends_at: org.trialEndsAt || null,
        is_active: org.isActive !== undefined ? org.isActive : true,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Organization;
  }

  async updateOrganization(id: string, org: Partial<Organization>): Promise<Organization | undefined> {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...(org.name !== undefined && { name: org.name }),
        ...(org.address !== undefined && { address: org.address }),
        ...(org.neighborhoodId !== undefined && { neighborhood_id: org.neighborhoodId }),
        ...(org.logoUrl !== undefined && { logo_url: org.logoUrl }),
        ...(org.subscriptionStatus !== undefined && { subscription_status: org.subscriptionStatus }),
        ...(org.isActive !== undefined && { is_active: org.isActive }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Organization;
  }

  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Organization[];
  }

  async getNeighborhoods(): Promise<any[]> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []).map((n: any) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      description: n.description,
    }));
  }

  async updateProfileOrgId(profileId: string, orgId: string, profileType: 'worker' | 'restaurant'): Promise<void> {
    const table = profileType === 'worker' ? 'worker_profiles' : 'restaurant_profiles';
    
    const { error } = await supabase
      .from(table)
      .update({ org_id: orgId })
      .eq('id', profileId);
    
    if (error) throw error;
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
        restaurant_profiles!inner(name, address, logo_url)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getRestaurantPromotions(restaurantId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        restaurant_id: promotion.restaurantId,
        title: promotion.title,
        description: promotion.description,
        image_url: promotion.imageUrl || null,
        discount_type: promotion.discountType,
        discount_value: promotion.discountValue,
        status: promotion.status || 'draft',
        start_date: promotion.startDate || null,
        end_date: promotion.endDate || null,
        max_claims: promotion.maxClaims || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Promotion;
  }

  async updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion | undefined> {
    const updateData: any = {};
    
    if (promotion.title !== undefined) updateData.title = promotion.title;
    if (promotion.description !== undefined) updateData.description = promotion.description;
    if (promotion.imageUrl !== undefined) updateData.image_url = promotion.imageUrl;
    if (promotion.discountType !== undefined) updateData.discount_type = promotion.discountType;
    if (promotion.discountValue !== undefined) updateData.discount_value = promotion.discountValue;
    if (promotion.status !== undefined) updateData.status = promotion.status;
    if (promotion.startDate !== undefined) updateData.start_date = promotion.startDate;
    if (promotion.endDate !== undefined) updateData.end_date = promotion.endDate;
    if (promotion.maxClaims !== undefined) updateData.max_claims = promotion.maxClaims;
    
    updateData.updated_at = new Date().toISOString();

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

  // Redemption operations
  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const { data, error } = await supabase
      .from('redemptions')
      .insert({
        claim_id: redemption.claimId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Redemption;
  }

  async getPromotionRedemptionCount(promotionId: string): Promise<number> {
    const { data, error } = await supabase
      .from('claims')
      .select('id')
      .eq('promotion_id', promotionId)
      .eq('is_redeemed', true);
    
    if (error) throw error;
    return data?.length || 0;
  }

  async getWorkerRedemptions(workerProfileId: string): Promise<Redemption[]> {
    const { data, error } = await supabase
      .from('redemptions')
      .select(`
        *,
        claims!inner(
          worker_id,
          promotion_id,
          code
        )
      `)
      .eq('claims.worker_id', workerProfileId);
    
    if (error) throw error;
    return data || [];
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
      .eq('worker_id', workerId);
    
    if (error) throw error;
    return data || [];
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const { data, error } = await supabase
      .from('claims')
      .insert({
        promotion_id: claim.promotionId,
        worker_id: claim.workerId,
        code: claim.code,
        expires_at: claim.expiresAt,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Claim;
  }

  async updateClaim(id: string, claim: Partial<Claim>): Promise<Claim | undefined> {
    const updateData: any = {};
    if (claim.isRedeemed !== undefined) updateData.is_redeemed = claim.isRedeemed;
    
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

  // Admin operations
  async getAllUsers(limit = 50, offset = 0): Promise<{ users: User[]; total: number }> {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return { users: data || [], total: count || 0 };
  }

  async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', `%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const updateData: any = {};
    if (user.email !== undefined) updateData.email = user.email;
    if (user.role !== undefined) updateData.role = user.role;
    if (user.password !== undefined) updateData.password = user.password;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as User;
  }

  async getUserWithProfile(id: string): Promise<any> {
    const user = await this.getUser(id);
    if (!user) return null;

    let profile = null;
    if (user.role === 'worker') {
      profile = await this.getWorkerProfile(id);
    } else if (user.role === 'restaurant') {
      profile = await this.getRestaurantProfile(id);
    }

    return { ...user, profile };
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: log.actorId || null,
        action: log.action,
        subject: log.subject,
        details: log.details || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as AuditLog;
  }

  async getAuditLogs(limit = 100, offset = 0): Promise<{ logs: AuditLog[]; total: number }> {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return { logs: data || [], total: count || 0 };
  }

  async getDashboardMetrics(): Promise<any> {
    const [usersResult, promotionsResult, claimsResult] = await Promise.all([
      supabase.from('users').select('role', { count: 'exact', head: true }),
      supabase.from('promotions').select('status', { count: 'exact', head: true }),
      supabase.from('claims').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalPromotions: promotionsResult.count || 0,
      totalClaims: claimsResult.count || 0,
    };
  }
}

export const storage = new SupabaseStorage();
