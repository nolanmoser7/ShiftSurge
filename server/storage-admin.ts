import { db } from "./db";
import { eq, desc, ilike, or, sql, notInArray, and } from "drizzle-orm";
import {
  type User,
  type Organization,
  type InsertOrganization,
  type AuditLog,
  type InsertAuditLog,
  users,
  organizations,
  auditLogs,
  workerProfiles,
  restaurantProfiles,
} from "@shared/schema";

export class AdminStorage {
  // User operations for admin
  async getAllUsers(searchQuery?: string): Promise<any[]> {
    const baseQuery = db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        workerRole: workerProfiles.workerRole,
        workerName: workerProfiles.name,
        restaurantName: restaurantProfiles.name,
        organizationId: restaurantProfiles.organizationId,
      })
      .from(users)
      .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .leftJoin(restaurantProfiles, eq(users.id, restaurantProfiles.userId))
      .orderBy(desc(users.createdAt));

    if (searchQuery) {
      return await baseQuery.where(ilike(users.email, `%${searchQuery}%`));
    }
    return await baseQuery;
  }

  async getUser(id: string): Promise<any | undefined> {
    const result = await db
      .select({
        user: users,
        workerProfile: workerProfiles,
        restaurantProfile: restaurantProfiles,
      })
      .from(users)
      .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
      .leftJoin(restaurantProfiles, eq(users.id, restaurantProfiles.userId))
      .where(eq(users.id, id))
      .limit(1);
    
    if (!result[0]) return undefined;
    
    const data = result[0];
    return {
      user: data.user,
      profile: data.workerProfile || data.restaurantProfile || null,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0]?.count || 0);
  }

  async getActiveUserCount(): Promise<number> {
    // Count users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo.toISOString()}`);
    
    return Number(result[0]?.count || 0);
  }

  // Organization operations
  async getOrganizations(): Promise<any[]> {
    // Join with restaurant profiles to show restaurant account details
    const result = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        address: organizations.address,
        neighborhoodId: organizations.neighborhoodId,
        logoUrl: organizations.logoUrl,
        subscriptionStatus: organizations.subscriptionStatus,
        isActive: organizations.isActive,
        createdAt: organizations.createdAt,
        restaurantCount: sql<number>`count(distinct ${restaurantProfiles.id})`,
        restaurantUsers: sql<string>`string_agg(distinct ${users.email}, ', ')`,
      })
      .from(organizations)
      .leftJoin(restaurantProfiles, eq(organizations.id, restaurantProfiles.organizationId))
      .leftJoin(users, eq(restaurantProfiles.userId, users.id))
      .groupBy(organizations.id)
      .orderBy(desc(organizations.createdAt));
    
    return result;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return result[0];
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(org).returning();
    return result[0];
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const result = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))
      .returning();
    return result[0];
  }

  async deleteOrganization(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  async getOrganizationCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(organizations);
    return Number(result[0]?.count || 0);
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async createAuditLogSimple(
    actorId: string,
    action: string,
    subject: string,
    details?: string
  ): Promise<AuditLog> {
    return this.createAuditLog({ actorId, action, subject, details });
  }

  async getAuditLogs(
    limit: number = 50, 
    offset: number = 0,
    action?: string,
    actor?: string
  ): Promise<{ logs: AuditLog[]; total: number }> {
    // Filter to show only business-relevant actions, exclude login/logout
    const excludedActions = ['ADMIN_LOGIN', 'ADMIN_LOGOUT'];
    
    // Build where conditions
    const conditions = [notInArray(auditLogs.action, excludedActions)];
    
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    
    if (actor) {
      conditions.push(sql`${auditLogs.actor} ILIKE ${`%${actor}%`}`);
    }
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(...conditions));
    
    const total = Number(countResult[0]?.count || 0);
    
    // Get logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { logs, total };
  }

  async getRecentAuditLogs(limit: number = 10): Promise<AuditLog[]> {
    // Filter to show only business-relevant actions, exclude login/logout
    const excludedActions = ['ADMIN_LOGIN', 'ADMIN_LOGOUT'];
    return await db
      .select()
      .from(auditLogs)
      .where(notInArray(auditLogs.action, excludedActions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const adminStorage = new AdminStorage();
