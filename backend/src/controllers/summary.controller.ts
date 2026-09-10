import type {
  Request,
  Response,
} from "express";

import {
  getSummary,
} from "../services/summary.service.js";

export async function getSummaryController(
  _req: Request,
  res: Response,
): Promise<void> {
  const data =
    await getSummary();

  res.json({
    data,
  });
}