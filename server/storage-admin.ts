import { supabase } from "./supabase";
import {
  type User,
  type Organization,
  type InsertOrganization,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";

export class AdminStorage {
  // User operations for admin
  async getAllUsers(searchQuery?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          worker_profiles!left(worker_role, name),
          restaurant_profiles!left(name)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('email', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        // Log error but try simpler query if join fails
        console.warn('Users query with profiles failed, trying fallback:', error.message);
        const fallbackQuery = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackQuery.error) throw fallbackQuery.error;
        
        return (fallbackQuery.data || []).map((user: any) => ({
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.is_active ?? true,
          createdAt: user.created_at,
          workerRole: null,
          workerName: null,
          restaurantName: null,
          organizationId: null,
        }));
      }
      
      // Transform the data to match the expected format
      return (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active ?? true,
        createdAt: user.created_at,
        workerRole: user.worker_profiles?.[0]?.worker_role || null,
        workerName: user.worker_profiles?.[0]?.name || null,
        restaurantName: user.restaurant_profiles?.[0]?.name || null,
        organizationId: null, // organization_id column doesn't exist yet
      }));
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
      return [];
    }
  }

  async getUser(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        worker_profiles(*),
        restaurant_profiles(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }

    return {
      user: {
        id: data.id,
        email: data.email,
        password: data.password,
        role: data.role,
        isActive: data.is_active ?? true,
        createdAt: data.created_at,
      },
      profile: data.worker_profiles?.[0] || data.restaurant_profiles?.[0] || null,
    };
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

    return {
      id: data.id,
      email: data.email,
      password: data.password,
      role: data.role,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    } as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // Update only fields that PostgREST recognizes
    const updateObj: any = {};
    if (updates.email !== undefined) updateObj.email = updates.email;
    if (updates.password !== undefined) updateObj.password = updates.password;
    if (updates.role !== undefined) updateObj.role = updates.role;
    if (updates.isActive !== undefined) updateObj.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('users')
      .update(updateObj)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      // If error is about is_active column, retry without it and throw specific error
      if (error.message?.includes('is_active')) {
        console.warn('is_active column not in PostgREST schema cache');
        delete updateObj.is_active;
        
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .update(updateObj)
          .eq('id', id)
          .select('*')
          .single();
        
        if (retryError) throw retryError;
        
        // Throw specific error for is_active update failure
        const updatedUser = {
          id: retryData.id,
          email: retryData.email,
          password: retryData.password,
          role: retryData.role,
          isActive: retryData.is_active ?? true,
          createdAt: retryData.created_at,
        } as User;
        
        if (updates.isActive !== undefined) {
          const err: any = new Error('Activation status could not be updated. Please try again in a few minutes.');
          err.code = 'ACTIVATION_UPDATE_FAILED';
          err.user = updatedUser;
          throw err;
        }
        
        return updatedUser;
      }
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      password: data.password,
      role: data.role,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    } as User;
  }

  async resetUserPassword(id: string, newPassword: string): Promise<boolean> {
    const { hashPassword } = await import('./auth');
    const hashedPassword = await hashPassword(newPassword);
    
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id)
      .select('id')
      .single();
    
    // Distinguish between "not found" and actual errors
    if (error) {
      // Check if it's a "no rows" error (user not found)
      if (error.code === 'PGRST116' || error.message?.includes('JSON object requested')) {
        return false; // User not found
      }
      // Other errors should be thrown
      throw error;
    }
    
    if (!data) {
      return false; // No data means user not found
    }
    
    return true;
  }

  async getUserCount(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }

  async getActiveUserCount(): Promise<number> {
    // Count users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count, error} = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    return count || 0;
  }

  // Analytics methods
  async getPromotionStats(): Promise<{ totalPromotions: number; totalClaims: number; totalRedemptions: number }> {
    const [promotionsResult, claimsResult, redemptionsResult] = await Promise.all([
      supabase.from('promotions').select('*', { count: 'exact', head: true }),
      supabase.from('claims').select('*', { count: 'exact', head: true }),
      supabase.from('redemptions').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalPromotions: promotionsResult.count || 0,
      totalClaims: claimsResult.count || 0,
      totalRedemptions: redemptionsResult.count || 0,
    };
  }

  async getDailyActivity(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch promotions, claims, and redemptions created in the last N days
    const [promotions, claims, redemptions] = await Promise.all([
      supabase
        .from('promotions')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('claims')
        .select('claimed_at')
        .gte('claimed_at', startDate.toISOString()),
      supabase
        .from('redemptions')
        .select('redeemed_at')
        .gte('redeemed_at', startDate.toISOString()),
    ]);

    // Group by date
    const dailyData: Record<string, { date: string; promotions: number; claims: number; redemptions: number }> = {};
    
    // Initialize all dates with zeros
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, promotions: 0, claims: 0, redemptions: 0 };
    }

    // Count promotions by date
    promotions.data?.forEach((p: any) => {
      const dateStr = new Date(p.created_at).toISOString().split('T')[0];
      if (dailyData[dateStr]) dailyData[dateStr].promotions++;
    });

    // Count claims by date
    claims.data?.forEach((c: any) => {
      const dateStr = new Date(c.claimed_at).toISOString().split('T')[0];
      if (dailyData[dateStr]) dailyData[dateStr].claims++;
    });

    // Count redemptions by date
    redemptions.data?.forEach((r: any) => {
      const dateStr = new Date(r.redeemed_at).toISOString().split('T')[0];
      if (dailyData[dateStr]) dailyData[dateStr].redemptions++;
    });

    // Convert to array and sort by date (oldest first for chart)
    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopRestaurants(limit: number = 5): Promise<any[]> {
    const { data, error } = await supabase
      .from('restaurant_profiles')
      .select(`
        id,
        name,
        user_id,
        promotions (id, current_claims)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching top restaurants:', error);
      return [];
    }

    // Calculate total promotions and total claims for each restaurant
    const restaurantsWithStats = (data || []).map((restaurant: any) => ({
      id: restaurant.id,
      name: restaurant.name,
      totalPromotions: restaurant.promotions?.length || 0,
      totalClaims: restaurant.promotions?.reduce((sum: number, p: any) => sum + (p.current_claims || 0), 0) || 0,
    }));

    // Sort by total claims (most popular restaurants)
    return restaurantsWithStats
      .sort((a, b) => b.totalClaims - a.totalClaims)
      .slice(0, limit);
  }

  // Organization operations
  async getOrganizations(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          address,
          neighborhood_id,
          logo_url,
          subscription_status,
          is_active,
          created_at,
          restaurant_profiles(
            id,
            users(email)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === 'PGRST205' || error.message?.includes('organizations')) {
          console.warn('Organizations table not found, returning empty results');
          return [];
        }
        throw error;
      }
      
      // Transform the data to match expected format
      return (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        address: org.address,
        neighborhoodId: org.neighborhood_id,
        logoUrl: org.logo_url,
        subscriptionStatus: org.subscription_status,
        isActive: org.is_active,
        createdAt: org.created_at,
        restaurantCount: org.restaurant_profiles?.length || 0,
        restaurantUsers: org.restaurant_profiles
          ?.map((rp: any) => rp.users?.email)
          .filter(Boolean)
          .join(', ') || '',
      }));
    } catch (err: any) {
      console.warn('Could not fetch organizations:', err.message);
      return [];
    }
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return undefined;
        // If table doesn't exist, return undefined
        if (error.code === 'PGRST205' || error.message?.includes('organizations')) {
          console.warn('Organizations table not found');
          return undefined;
        }
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        neighborhoodId: data.neighborhood_id,
        logoUrl: data.logo_url,
        subscriptionStatus: data.subscription_status,
        subscriptionPlanId: data.subscription_plan_id,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        trialEndsAt: data.trial_ends_at,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Organization;
    } catch (err: any) {
      console.warn('Could not fetch organization:', err.message);
      return undefined;
    }
  }

  async createOrganization(org: InsertOrganization): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: org.name,
          address: org.address,
          neighborhood_id: org.neighborhoodId,
          logo_url: org.logoUrl,
          subscription_status: org.subscriptionStatus,
          subscription_plan_id: org.subscriptionPlanId,
          stripe_customer_id: org.stripeCustomerId,
          stripe_subscription_id: org.stripeSubscriptionId,
          trial_ends_at: org.trialEndsAt,
          is_active: org.isActive,
        })
        .select()
        .single();
      
      if (error) {
        // If table doesn't exist, return null
        if (error.code === 'PGRST205' || error.message?.includes('organizations')) {
          console.warn('Organizations table not found, cannot create organization');
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        neighborhoodId: data.neighborhood_id,
        logoUrl: data.logo_url,
        subscriptionStatus: data.subscription_status,
        subscriptionPlanId: data.subscription_plan_id,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        trialEndsAt: data.trial_ends_at,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Organization;
    } catch (err: any) {
      console.warn('Could not create organization:', err.message);
      return null;
    }
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    try {
      // Convert camelCase to snake_case for Supabase
      const snakeCaseUpdates: any = {};
      if (updates.name !== undefined) snakeCaseUpdates.name = updates.name;
      if (updates.address !== undefined) snakeCaseUpdates.address = updates.address;
      if (updates.neighborhoodId !== undefined) snakeCaseUpdates.neighborhood_id = updates.neighborhoodId;
      if (updates.logoUrl !== undefined) snakeCaseUpdates.logo_url = updates.logoUrl;
      if (updates.subscriptionStatus !== undefined) snakeCaseUpdates.subscription_status = updates.subscriptionStatus;
      if (updates.isActive !== undefined) snakeCaseUpdates.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('organizations')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        // If table doesn't exist, return undefined
        if (error.code === 'PGRST205' || error.message?.includes('organizations')) {
          console.warn('Organizations table not found');
          return undefined;
        }
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        neighborhoodId: data.neighborhood_id,
        logoUrl: data.logo_url,
        subscriptionStatus: data.subscription_status,
        subscriptionPlanId: data.subscription_plan_id,
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        trialEndsAt: data.trial_ends_at,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Organization;
    } catch (err: any) {
      console.warn('Could not update organization:', err.message);
      return undefined;
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      
      if (error) {
        // If table doesn't exist, silently skip
        if (error.code === 'PGRST205' || error.message?.includes('organizations')) {
          console.warn('Organizations table not found');
          return;
        }
        throw error;
      }
    } catch (err: any) {
      console.warn('Could not delete organization:', err.message);
    }
  }

  async getOrganizationCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        // If table doesn't exist, return 0
        if (error.code === 'PGRST205' || error.message?.includes('organizations')) {
          console.warn('Organizations table not found, returning count 0');
          return 0;
        }
        throw error;
      }
      return count || 0;
    } catch (err: any) {
      console.warn('Could not count organizations:', err.message);
      return 0;
    }
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog | null> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: log.actorId,
          action: log.action,
          subject: log.subject,
          details: log.details,
        })
        .select()
        .single();
      
      if (error) {
        // If table doesn't exist, silently skip audit logging
        if (error.code === 'PGRST205' || error.message?.includes('audit_logs')) {
          console.warn('Audit logs table not found, skipping audit log');
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        actorId: data.actor_id,
        action: data.action,
        subject: data.subject,
        details: data.details,
        createdAt: data.created_at,
      } as AuditLog;
    } catch (err: any) {
      // Gracefully handle missing table - don't fail the operation
      console.warn('Could not create audit log:', err.message);
      return null;
    }
  }

  async createAuditLogSimple(
    actorId: string,
    action: string,
    subject: string,
    details?: string
  ): Promise<AuditLog | null> {
    return this.createAuditLog({ actorId, action, subject, details });
  }

  async getAuditLogs(
    limit: number = 50, 
    offset: number = 0,
    action?: string,
    actor?: string
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      // Filter to show only business-relevant actions, exclude login/logout
      const excludedActions = ['ADMIN_LOGIN', 'ADMIN_LOGOUT'];
      
      // Build query with filters
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .not('action', 'in', `(${excludedActions.join(',')})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (action) {
        query = query.eq('action', action);
      }
      
      if (actor) {
        query = query.ilike('actor', `%${actor}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === 'PGRST205' || error.message?.includes('audit_logs')) {
          console.warn('Audit logs table not found, returning empty results');
          return { logs: [], total: 0 };
        }
        throw error;
      }
      
      const logs = (data || []).map((log: any) => ({
        id: log.id,
        actorId: log.actor_id,
        action: log.action,
        subject: log.subject,
        details: log.details,
        createdAt: log.created_at,
      })) as AuditLog[];

      return { logs, total: count || 0 };
    } catch (err: any) {
      console.warn('Could not fetch audit logs:', err.message);
      return { logs: [], total: 0 };
    }
  }

  async getRecentAuditLogs(limit: number = 10): Promise<AuditLog[]> {
    try {
      // Filter to show only business-relevant actions, exclude login/logout
      const excludedActions = ['ADMIN_LOGIN', 'ADMIN_LOGOUT'];
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .not('action', 'in', `(${excludedActions.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === 'PGRST205' || error.message?.includes('audit_logs')) {
          console.warn('Audit logs table not found, returning empty results');
          return [];
        }
        throw error;
      }
      
      return (data || []).map((log: any) => ({
        id: log.id,
        actorId: log.actor_id,
        action: log.action,
        subject: log.subject,
        details: log.details,
        createdAt: log.created_at,
      })) as AuditLog[];
    } catch (err: any) {
      console.warn('Could not fetch recent audit logs:', err.message);
      return [];
    }
  }
}

export const adminStorage = new AdminStorage();
