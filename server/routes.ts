import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords, requireAuth, requireWorker, requireRestaurant, type AuthRequest } from "./auth";
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
        await storage.createRestaurantProfile({
          userId: user.id,
          name: data.name,
          address: data.address,
          logoUrl: data.logoUrl,
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

      const promotion = await storage.createPromotion({
        ...req.body,
        restaurantId: restaurantProfile.id,
      });

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

      const redemption = await storage.createRedemption({
        claimId: claim.id,
      });

      res.json(redemption);
    } catch (error) {
      console.error("Redemption error:", error);
      res.status(400).json({ error: "Failed to redeem" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
