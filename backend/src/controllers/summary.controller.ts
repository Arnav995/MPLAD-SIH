import type { Request, Response, NextFunction } from "express";

import {
  getSummary,
  getDistrictSummaries,
  getMpSummaries,
} from "../services/summary.service.js";

export async function getSummaryController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getSummary();

    res.json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDistrictSummariesController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getDistrictSummaries();

    res.json({
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMpSummariesController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getMpSummaries();

    res.json({
      data,
    });
  } catch (error) {
    next(error);
  }
}