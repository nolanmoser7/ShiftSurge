import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminStorage } from "./storage-admin";
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

        // Log business action for admin audit
        await adminStorage.createAuditLogSimple(
          user.id,
          "WORKER_ADDED",
          `worker:${user.id}`,
          JSON.stringify({ 
            email: user.email,
            name: data.name,
            workerRole: data.workerRole || "other"
          })
        );
      } else {
        // Create restaurant profile
        await storage.createRestaurantProfile({
          userId: user.id,
          name: data.name,
          address: data.address,
          logoUrl: data.logoUrl,
        });

        // Log business action for admin audit
        await adminStorage.createAuditLogSimple(
          user.id,
          "RESTAURANT_ONBOARDED",
          `restaurant:${user.id}`,
          JSON.stringify({ 
            email: user.email,
            name: data.name,
            address: data.address
          })
        );
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
        restaurantId: restaurantProfile.id,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };

      const promotion = await storage.createPromotion(promotionData);

      // Log business action for admin audit
      await adminStorage.createAuditLogSimple(
        req.userId!,
        "PROMOTION_CREATED",
        `promotion:${promotion.id}`,
        JSON.stringify({ 
          restaurantId: req.userId,
          restaurantProfileId: restaurantProfile.id,
          title: promotion.title,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue
        })
      );

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

      const promotions = await storage.getRestaurantPromotions(restaurantProfile.id);
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
        claimId: claim.id,
      });

      // Mark the claim as redeemed
      await storage.updateClaim(claim.id, { isRedeemed: true });

      // Log business action for admin audit
      const promotion = await storage.getPromotion(claim.promotionId);
      const workerProfile = await storage.getWorkerProfile(claim.workerId);
      await adminStorage.createAuditLogSimple(
        req.userId!,
        "PROMOTION_REDEEMED",
        `redemption:${redemption.id}`,
        JSON.stringify({ 
          promotionId: claim.promotionId,
          promotionTitle: promotion?.title,
          workerId: claim.workerId,
          workerName: workerProfile?.name,
          restaurantId: req.userId,
          restaurantProfileId: restaurantProfile.id
        })
      );

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

      const user = await adminStorage.getUserByEmail(email);
      console.log("Admin login - user fetched:", user ? { id: user.id, email: user.email, role: user.role } : "null");
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify user is a superadmin (check role OR specific admin email)
      // TODO: Once super_admin enum is added to Supabase, remove email check
      const isAdmin = user.role === "super_admin" || email === "admin@shiftsurge.com";
      
      if (!isAdmin) {
        console.log("Admin login - access denied. User role:", user.role, "Email:", email);
        return res.status(403).json({ error: "Superadmin access required" });
      }

      const valid = await comparePasswords(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set admin session (separate from regular user session)
      (req as any).session.adminUserId = user.id;
      // Always set role as super_admin for admin users
      (req as any).session.adminUserRole = "super_admin";

      // Try to log admin login (gracefully handle if audit_logs table doesn't exist yet)
      try {
        await adminStorage.createAuditLogSimple(
          user.id,
          "ADMIN_LOGIN",
          "auth",
          JSON.stringify({ email: user.email })
        );
      } catch (auditError: any) {
        console.warn("Could not create audit log (table may not exist):", auditError.message);
      }

      res.json({ user: { id: user.id, email: user.email, role: "super_admin" } });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Log admin logout
      await adminStorage.createAuditLogSimple(
        req.userId!,
        "ADMIN_LOGOUT",
        "auth",
        JSON.stringify({ userId: req.userId })
      );

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
      const user = await adminStorage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Always return super_admin role for admin sessions (workaround for missing enum)
      res.json({ user: { id: user.id, email: user.email, role: "super_admin" } });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin user" });
    }
  });

  // Dashboard metrics
  app.get("/api/admin/dashboard", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const [totalUsers, totalOrgs, activeUsers, recentLogs] = await Promise.all([
        adminStorage.getUserCount(),
        adminStorage.getOrganizationCount(),
        adminStorage.getActiveUserCount(),
        adminStorage.getRecentAuditLogs(10),
      ]);

      res.json({
        totalUsers,
        totalOrgs,
        activeUsers,
        recentLogs,
      });
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // User management
  app.get("/api/admin/users", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const query = req.query.q as string | undefined;
      const users = await adminStorage.getAllUsers(query);
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const user = await adminStorage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updates = req.body;
      const user = await adminStorage.updateUser(req.params.id, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log admin action
      await adminStorage.createAuditLogSimple(
        req.userId!,
        "UPDATE_USER",
        `user:${req.params.id}`,
        JSON.stringify({ updates })
      );

      // Remove password from response for security
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update user error:", error);
      
      // Handle partial success (e.g., role updated but activation failed)
      if (error.code === 'ACTIVATION_UPDATE_FAILED' && error.user) {
        const { password: _, ...userWithoutPassword } = error.user;
        return res.status(409).json({ 
          error: error.message,
          user: userWithoutPassword,
          partialSuccess: true
        });
      }
      
      res.status(500).json({ error: error.message || "Failed to update user" });
    }
  });

  // Organization management
  app.get("/api/admin/organizations", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const organizations = await adminStorage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Get organizations error:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/admin/organizations", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name } = req.body;
      const organization = await adminStorage.createOrganization({ name });

      if (!organization) {
        return res.status(500).json({ error: "Failed to create organization" });
      }

      // Log admin action
      await adminStorage.createAuditLogSimple(
        req.userId!,
        "CREATE_ORGANIZATION",
        `organization:${organization.id}`,
        JSON.stringify({ name })
      );

      res.json(organization);
    } catch (error) {
      console.error("Create organization error:", error);
      res.status(500).json({ error: "Failed to create organization" });
    }
  });

  app.get("/api/admin/organizations/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const organization = await adminStorage.getOrganization(req.params.id);
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
      const organization = await adminStorage.updateOrganization(req.params.id, updates);
      
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Log admin action
      await adminStorage.createAuditLogSimple(
        req.userId!,
        "UPDATE_ORGANIZATION",
        `organization:${req.params.id}`,
        JSON.stringify({ updates })
      );

      res.json(organization);
    } catch (error) {
      console.error("Update organization error:", error);
      res.status(500).json({ error: "Failed to update organization" });
    }
  });

  app.delete("/api/admin/organizations/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      await adminStorage.deleteOrganization(req.params.id);

      // Log admin action
      await adminStorage.createAuditLogSimple(
        req.userId!,
        "DELETE_ORGANIZATION",
        `organization:${req.params.id}`,
        JSON.stringify({ id: req.params.id })
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Delete organization error:", error);
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });

  // Audit logs
  app.get("/api/admin/audit-logs", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const action = req.query.action as string;
      const actor = req.query.actor as string;

      const result = await adminStorage.getAuditLogs(limit, offset, action, actor);
      res.json(result);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
