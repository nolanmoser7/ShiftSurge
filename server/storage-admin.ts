import { db } from "./db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import {
  type User,
  type Organization,
  type InsertOrganization,
  type AuditLog,
  type InsertAuditLog,
  users,
  organizations,
  auditLogs,
} from "@shared/schema";

export class AdminStorage {
  // User operations for admin
  async getAllUsers(searchQuery?: string): Promise<User[]> {
    if (searchQuery) {
      return await db
        .select()
        .from(users)
        .where(
          or(
            ilike(users.email, `%${searchQuery}%`)
          )
        )
        .orderBy(desc(users.createdAt));
    }
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
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
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
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

  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getRecentAuditLogs(limit: number = 10): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const adminStorage = new AdminStorage();
