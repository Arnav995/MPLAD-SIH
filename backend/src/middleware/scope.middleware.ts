import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

// Attaches req.scopeWhere — a Prisma WHERE clause fragment for Work queries
export interface ScopedRequest extends AuthRequest {
  scopeWhere?: Record<string, any>;
}

export function applyScope(req: ScopedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });

  if (req.user.role === "MINISTRY") {
    req.scopeWhere = {}; // no restriction
  } else if (req.user.role === "DISTRICT") {
    if (!req.user.districtId) {
      return res.status(403).json({ error: "No district assigned to this account" });
    }
    req.scopeWhere = { districtId: req.user.districtId };
  } else if (req.user.role === "MP") {
    if (!req.user.mpId) {
      return res.status(403).json({ error: "No MP assigned to this account" });
    }
    req.scopeWhere = { mpId: req.user.mpId };
  }

  next();
}