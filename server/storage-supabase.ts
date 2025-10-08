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
  type Neighborhood,
  type InsertNeighborhood,
  type Promotion,
  type InsertPromotion,
  type Redemption,
  type InsertRedemption,
  type Favorite,
  type InsertFavorite,
  type InviteToken,
  type InsertInviteToken,
  type Claim,
  type InsertClaim,
  type AuditLog,
  type InsertAuditLog,
  type FeatureFlag,
  type InsertFeatureFlag,
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

  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<Organization>): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;

  // Neighborhood operations
  getNeighborhood(id: string): Promise<Neighborhood | undefined>;
  getNeighborhoodBySlug(slug: string): Promise<Neighborhood | undefined>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
  getNeighborhoods(): Promise<Neighborhood[]>;

  // Promotion operations
  getPromotion(id: string): Promise<Promotion | undefined>;
  getActivePromotions(neighborhoodId?: string): Promise<any[]>;
  getOrganizationPromotions(organizationId: string): Promise<any[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion | undefined>;

  // Redemption operations
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  getPromotionRedemptionCount(promotionId: string): Promise<number>;
  getWorkerRedemptions(workerProfileId: string): Promise<Redemption[]>;

  // Favorite operations
  getFavorites(workerProfileId: string): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(id: string): Promise<void>;
  isFavorited(workerProfileId: string, promotionId: string): Promise<boolean>;

  // Invite token operations
  getInviteToken(token: string): Promise<InviteToken | undefined>;
  createInviteToken(inviteToken: InsertInviteToken): Promise<InviteToken>;
  incrementInviteTokenUse(id: string): Promise<void>;
  getOrganizationInviteTokens(organizationId: string): Promise<InviteToken[]>;

  // Legacy Claim operations (for backward compatibility)
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
  updateFeatureFlag(key: string, enabled: boolean, payload?: string): Promise<FeatureFlag>;
  getFeatureFlags(): Promise<FeatureFlag[]>;
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
        organization_id: profile.organizationId || null,
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
        organization_id: profile.organizationId,
        name: profile.name
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
        logo_url: org.logoUrl || null,
        subscription_status: org.subscriptionStatus || 'trial',
        subscription_plan_id: org.subscriptionPlanId || null,
        stripe_customer_id: org.stripeCustomerId || null,
        stripe_subscription_id: org.stripeSubscriptionId || null,
        trial_ends_at: org.trialEndsAt || null,
        is_active: org.isActive !== undefined ? org.isActive : true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Organization;
  }

  async updateOrganization(id: string, org: Partial<Organization>): Promise<Organization | undefined> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (org.name !== undefined) updateData.name = org.name;
    if (org.address !== undefined) updateData.address = org.address;
    if (org.neighborhoodId !== undefined) updateData.neighborhood_id = org.neighborhoodId;
    if (org.logoUrl !== undefined) updateData.logo_url = org.logoUrl;
    if (org.subscriptionStatus !== undefined) updateData.subscription_status = org.subscriptionStatus;
    if (org.subscriptionPlanId !== undefined) updateData.subscription_plan_id = org.subscriptionPlanId;
    if (org.stripeCustomerId !== undefined) updateData.stripe_customer_id = org.stripeCustomerId;
    if (org.stripeSubscriptionId !== undefined) updateData.stripe_subscription_id = org.stripeSubscriptionId;
    if (org.trialEndsAt !== undefined) updateData.trial_ends_at = org.trialEndsAt;
    if (org.isActive !== undefined) updateData.is_active = org.isActive;

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
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
    return (data || []) as Organization[];
  }

  // Neighborhood operations
  async getNeighborhood(id: string): Promise<Neighborhood | undefined> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Neighborhood;
  }

  async getNeighborhoodBySlug(slug: string): Promise<Neighborhood | undefined> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Neighborhood;
  }

  async createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .insert({
        name: neighborhood.name,
        slug: neighborhood.slug,
        description: neighborhood.description || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Neighborhood;
  }

  async getNeighborhoods(): Promise<Neighborhood[]> {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Neighborhood[];
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

  async getActivePromotions(neighborhoodId?: string): Promise<any[]> {
    let query = supabase
      .from('promotions')
      .select(`
        *,
        organizations!inner (
          name,
          address,
          logo_url
        ),
        neighborhoods (
          name,
          slug
        )
      `)
      .eq('status', 'active')
      .eq('is_active', true);
    
    if (neighborhoodId) {
      query = query.eq('neighborhood_id', neighborhoodId);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(promo => ({
      ...promo,
      organizationName: promo.organizations?.name,
      organizationAddress: promo.organizations?.address,
      organizationLogoUrl: promo.organizations?.logo_url,
      neighborhoodName: promo.neighborhoods?.name,
      neighborhoodSlug: promo.neighborhoods?.slug
    }));
  }

  async getOrganizationPromotions(organizationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('organization_id', organizationId)
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
        organization_id: promotion.organizationId,
        neighborhood_id: promotion.neighborhoodId || null,
        title: promotion.title,
        description: promotion.description,
        image_url: promotion.imageUrl || null,
        discount_type: promotion.discountType,
        discount_value: promotion.discountValue,
        start_date: promotion.startDate || null,
        end_date: promotion.endDate || null,
        is_active: promotion.isActive !== undefined ? promotion.isActive : true,
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
    if (promotion.status !== undefined) updateData.status = promotion.status;
    if (promotion.isActive !== undefined) updateData.is_active = promotion.isActive;
    if (promotion.neighborhoodId !== undefined) updateData.neighborhood_id = promotion.neighborhoodId;

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
        promotion_id: redemption.promotionId,
        worker_profile_id: redemption.workerProfileId,
        validated_by_organization_id: redemption.validatedByOrganizationId,
        validated_by_user_id: redemption.validatedByUserId || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Redemption;
  }

  async getPromotionRedemptionCount(promotionId: string): Promise<number> {
    const { data, error } = await supabase
      .from('redemptions')
      .select('id')
      .eq('promotion_id', promotionId);
    
    if (error) throw error;
    return (data || []).length;
  }

  async getWorkerRedemptions(workerProfileId: string): Promise<Redemption[]> {
    const { data, error } = await supabase
      .from('redemptions')
      .select('*')
      .eq('worker_profile_id', workerProfileId)
      .order('redeemed_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Redemption[];
  }

  // Favorite operations
  async getFavorites(workerProfileId: string): Promise<Favorite[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('worker_profile_id', workerProfileId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Favorite[];
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        worker_profile_id: favorite.workerProfileId,
        promotion_id: favorite.promotionId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Favorite;
  }

  async deleteFavorite(id: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async isFavorited(workerProfileId: string, promotionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('worker_profile_id', workerProfileId)
      .eq('promotion_id', promotionId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }
    return !!data;
  }

  // Invite token operations
  async getInviteToken(token: string): Promise<InviteToken | undefined> {
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as InviteToken;
  }

  async createInviteToken(inviteToken: InsertInviteToken): Promise<InviteToken> {
    const { data, error } = await supabase
      .from('invite_tokens')
      .insert({
        organization_id: inviteToken.organizationId,
        token: inviteToken.token,
        created_by_user_id: inviteToken.createdByUserId,
        max_uses: inviteToken.maxUses || null,
        expires_at: inviteToken.expiresAt || null,
        is_active: inviteToken.isActive !== undefined ? inviteToken.isActive : true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as InviteToken;
  }

  async incrementInviteTokenUse(id: string): Promise<void> {
    const token = await supabase
      .from('invite_tokens')
      .select('current_uses')
      .eq('id', id)
      .single();
    
    if (token.data) {
      await supabase
        .from('invite_tokens')
        .update({ current_uses: (token.data.current_uses || 0) + 1 })
        .eq('id', id);
    }
  }

  async getOrganizationInviteTokens(organizationId: string): Promise<InviteToken[]> {
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as InviteToken[];
  }

  // Legacy Claim operations (for backward compatibility)
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

  // Admin operations
  async getAllUsers(limit: number = 50, offset: number = 0): Promise<{ users: User[]; total: number }> {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return { users: (data || []) as User[], total: count || 0 };
  }

  async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return (data || []) as User[];
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const updateData: any = {};
    if (user.email !== undefined) updateData.email = user.email;
    if (user.role !== undefined) updateData.role = user.role;

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
    if (!user) return undefined;

    let profile = null;
    if (user.role === 'worker') {
      profile = await this.getWorkerProfile(id);
    } else if (user.role === 'restaurant') {
      profile = await this.getRestaurantProfile(id);
    }

    return { user, profile };
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: log.actorId || null,
        action: log.action,
        subject: log.subject,
        details: log.details || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as AuditLog;
  }

  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<{ logs: AuditLog[]; total: number }> {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return { logs: (data || []) as AuditLog[], total: count || 0 };
  }

  async getDashboardMetrics(): Promise<any> {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total organizations
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 30 days) - users who have created promotions, redemptions, or claims
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentRedemptions } = await supabase
      .from('redemptions')
      .select('validated_by_user_id')
      .gte('redeemed_at', thirtyDaysAgo.toISOString());

    const activeUserIds = new Set((recentRedemptions || []).map(r => r.validated_by_user_id).filter(Boolean));
    const activeUsers = activeUserIds.size;

    // Get recent audit logs
    const { data: recentLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalUsers: totalUsers || 0,
      totalOrgs: totalOrgs || 0,
      activeUsers,
      recentLogs: recentLogs || []
    };
  }

  async updateFeatureFlag(key: string, enabled: boolean, payload?: string): Promise<FeatureFlag> {
    const { data: existing } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('key', key)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({
          enabled,
          payload: payload || null,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
        .single();
      
      if (error) throw error;
      return data as FeatureFlag;
    } else {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert({
          key,
          enabled,
          payload: payload || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as FeatureFlag;
    }
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key', { ascending: true });
    
    if (error) throw error;
    return (data || []) as FeatureFlag[];
  }
}

export const storage = new SupabaseStorage();
