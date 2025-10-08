import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords, requireAuth, requireWorker, requireRestaurant, requireAdmin, type AuthRequest } from "./auth";
import { z } from "zod";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req: AuthRequest, res) => {
    try {
      const { email, password, role, name, workerRole, address, logoUrl } = req.body;
      
      // Validate input
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["worker", "restaurant"]),
        name: z.string().min(1),
        workerRole: z.enum(["server", "bartender", "chef", "host", "manager", "other"]).optional(),
        address: z.string().optional(),
        logoUrl: z.string().optional(),
      });
      
      const data = schema.parse({ email, password, role, name, workerRole, address, logoUrl });

      // Check if user exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        role: data.role,
      });

      // Create profile based on role
      if (data.role === "worker") {
        await storage.createWorkerProfile({
          userId: user.id,
          name: data.name,
          workerRole: data.workerRole || "other",
          isVerified: false,
        });
      } else {
        // Create organization first
        const organization = await storage.createOrganization({
          name: data.name,
          address: data.address,
          logoUrl: data.logoUrl,
        });

        // Then create restaurant profile linked to organization
        await storage.createRestaurantProfile({
          userId: user.id,
          organizationId: organization.id,
          name: data.name,
        });
      }

      // Set session
      (req as any).session.userId = user.id;
      (req as any).session.userRole = user.role;

      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req: AuthRequest, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await comparePasswords(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      (req as any).session.userId = user.id;
      (req as any).session.userRole = user.role;

      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    (req as any).session.destroy((err: Error | null) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let profile;
      if (user.role === "worker") {
        profile = await storage.getWorkerProfile(user.id);
      } else {
        profile = await storage.getRestaurantProfile(user.id);
      }

      res.json({ user: { id: user.id, email: user.email, role: user.role }, profile });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Promotion routes
  app.get("/api/promotions", async (req, res) => {
    try {
      const promotions = await storage.getActivePromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  app.get("/api/promotions/:id", async (req, res) => {
    try {
      const promotion = await storage.getPromotion(req.params.id);
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotion" });
    }
  });

  app.post("/api/promotions", requireRestaurant, async (req: AuthRequest, res) => {
    try {
      const restaurantProfile = await storage.getRestaurantProfile(req.userId!);
      if (!restaurantProfile) {
        return res.status(404).json({ error: "Restaurant profile not found" });
      }

      // Convert date strings to Date objects
      const promotionData = {
        ...req.body,
        organizationId: restaurantProfile.organizationId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };

      const promotion = await storage.createPromotion(promotionData);

      res.json(promotion);
    } catch (error) {
      console.error("Create promotion error:", error);
      res.status(400).json({ error: "Failed to create promotion" });
    }
  });

  app.patch("/api/promotions/:id", requireRestaurant, async (req: AuthRequest, res) => {
    try {
      const promotion = await storage.updatePromotion(req.params.id, req.body);
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }
      res.json(promotion);
    } catch (error) {
      res.status(400).json({ error: "Failed to update promotion" });
    }
  });

  app.get("/api/restaurant/promotions", requireRestaurant, async (req: AuthRequest, res) => {
    try {
      const restaurantProfile = await storage.getRestaurantProfile(req.userId!);
      if (!restaurantProfile) {
        return res.status(404).json({ error: "Restaurant profile not found" });
      }

      const promotions = await storage.getOrganizationPromotions(restaurantProfile.organizationId);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  // Claim routes
  app.post("/api/claims", requireWorker, async (req: AuthRequest, res) => {
    try {
      const workerProfile = await storage.getWorkerProfile(req.userId!);
      if (!workerProfile) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      const { promotionId } = req.body;
      const promotion = await storage.getPromotion(promotionId);
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      // Generate unique code
      const code = randomBytes(4).toString("hex").toUpperCase();

      // Set expiration (e.g., 24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const claim = await storage.createClaim({
        promotionId,
        workerId: workerProfile.id,
        code,
        expiresAt,
        isRedeemed: false,
      });

      res.json(claim);
    } catch (error) {
      console.error("Claim error:", error);
      res.status(400).json({ error: "Failed to claim promotion" });
    }
  });

  app.get("/api/claims", requireWorker, async (req: AuthRequest, res) => {
    try {
      const workerProfile = await storage.getWorkerProfile(req.userId!);
      if (!workerProfile) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      const claims = await storage.getWorkerClaims(workerProfile.id);
      res.json(claims);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Redemption routes
  app.post("/api/redemptions", requireRestaurant, async (req: AuthRequest, res) => {
    try {
      const { code } = req.body;
      
      const claim = await storage.getClaimByCode(code);
      if (!claim) {
        return res.status(404).json({ error: "Invalid code" });
      }

      if (claim.isRedeemed) {
        return res.status(400).json({ error: "Code already redeemed" });
      }

      if (new Date() > new Date(claim.expiresAt)) {
        return res.status(400).json({ error: "Code expired" });
      }

      const restaurantProfile = await storage.getRestaurantProfile(req.userId!);
      if (!restaurantProfile) {
        return res.status(404).json({ error: "Restaurant profile not found" });
      }

      const redemption = await storage.createRedemption({
        promotionId: claim.promotionId,
        workerProfileId: claim.workerId,
        validatedByOrganizationId: restaurantProfile.organizationId,
        validatedByUserId: req.userId,
      });

      // Mark the claim as redeemed
      await storage.updateClaim(claim.id, { isRedeemed: true });

      res.json(redemption);
    } catch (error) {
      console.error("Redemption error:", error);
      res.status(400).json({ error: "Failed to redeem" });
    }
  });

  // Admin routes
  app.post("/api/admin/login", async (req: AuthRequest, res) => {
    try {
      const { email, password } = req.body;

      console.log("[ADMIN LOGIN] Attempting login for:", email);
      const user = await storage.getUserByEmail(email);
      console.log("[ADMIN LOGIN] User found:", !!user, "Role:", user?.role);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify user is a superadmin (temporarily allow restaurant for testing)
      if (user.role !== "super_admin" && user.email !== "admin@shiftsurge.com") {
        console.log("[ADMIN LOGIN] User role mismatch. Expected super_admin, got:", user.role);
        return res.status(403).json({ error: "Superadmin access required" });
      }

      console.log("[ADMIN LOGIN] Comparing password...");
      const valid = await comparePasswords(password, user.password);
      console.log("[ADMIN LOGIN] Password valid:", valid);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set admin session (separate from regular user session)
      (req as any).session.adminUserId = user.id;
      (req as any).session.adminUserRole = user.role;

      // Log admin login (temporarily disabled - audit_logs table not in Supabase yet)
      // TODO: Enable after syncing schema to Supabase
      /*
      await storage.createAuditLog({
        actorId: user.id,
        action: "ADMIN_LOGIN",
        subject: "auth",
        details: JSON.stringify({ email: user.email }),
      });
      */

      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Log admin logout (temporarily disabled)
      // TODO: Enable after syncing schema to Supabase
      /*
      await storage.createAuditLog({
        actorId: req.userId,
        action: "ADMIN_LOGOUT",
        subject: "auth",
        details: JSON.stringify({ userId: req.userId }),
      });
      */

      // Clear admin session
      delete (req as any).session.adminUserId;
      delete (req as any).session.adminUserRole;

      res.json({ success: true });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/admin/me", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin user" });
    }
  });

  // Dashboard metrics
  app.get("/api/admin/dashboard", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // User management
  app.get("/api/admin/users", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const query = req.query.q as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (query) {
        const users = await storage.searchUsers(query);
        res.json({ users, total: users.length });
      } else {
        const result = await storage.getAllUsers(limit, offset);
        res.json(result);
      }
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userWithProfile = await storage.getUserWithProfile(req.params.id);
      if (!userWithProfile) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(userWithProfile);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action (temporarily disabled)
      // TODO: Enable after syncing schema to Supabase
      /*
      await storage.createAuditLog({
        actorId: req.userId,
        action: "UPDATE_USER",
        subject: `user:${req.params.id}`,
        details: JSON.stringify({ updates }),
      });
      */

      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Organization management
  app.get("/api/admin/organizations", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Get organizations error:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.get("/api/admin/organizations/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Get organization error:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  app.patch("/api/admin/organizations/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updates = req.body;
      const organization = await storage.updateOrganization(req.params.id, updates);
      
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Log admin action (temporarily disabled)
      // TODO: Enable after syncing schema to Supabase
      /*
      await storage.createAuditLog({
        actorId: req.userId,
        action: "UPDATE_ORGANIZATION",
        subject: `organization:${req.params.id}`,
        details: JSON.stringify({ updates }),
      });
      */

      res.json(organization);
    } catch (error) {
      console.error("Update organization error:", error);
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  // Audit logs
  app.get("/api/admin/audit-logs", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getAuditLogs(limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Feature flags
  app.get("/api/admin/feature-flags", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error("Get feature flags error:", error);
      res.status(500).json({ error: "Failed to fetch feature flags" });
    }
  });

  app.put("/api/admin/feature-flags/:key", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { enabled, payload } = req.body;
      const flag = await storage.updateFeatureFlag(req.params.key, enabled, payload);

      // Log admin action (temporarily disabled)
      // TODO: Enable after syncing schema to Supabase
      /*
      await storage.createAuditLog({
        actorId: req.userId,
        action: "UPDATE_FEATURE_FLAG",
        subject: `feature_flag:${req.params.key}`,
        details: JSON.stringify({ enabled, payload }),
      });
      */

      res.json(flag);
    } catch (error) {
      console.error("Update feature flag error:", error);
      res.status(500).json({ error: "Failed to update feature flag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
