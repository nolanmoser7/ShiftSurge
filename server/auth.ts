import { Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(
  supplied: string,
  stored: string
): Promise<boolean> {
  const [hashedPassword, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "worker" | "restaurant";
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (!session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.userId = session.userId;
  req.userRole = session.userRole;
  next();
}

export function requireWorker(req: AuthRequest, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (!session?.userId || session.userRole !== "worker") {
    return res.status(403).json({ error: "Worker access required" });
  }
  req.userId = session.userId;
  req.userRole = session.userRole;
  next();
}

export function requireRestaurant(req: AuthRequest, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (!session?.userId || session.userRole !== "restaurant") {
    return res.status(403).json({ error: "Restaurant access required" });
  }
  req.userId = session.userId;
  req.userRole = session.userRole;
  next();
}
