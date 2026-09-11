import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getTier2Digest,
} from "../services/alert.service.js";

export async function getTier2DigestController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const alerts = await getTier2Digest();

    res.json({
      tier: "TIER_2",
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    next(error);
  }
}