import { Request, Response, NextFunction } from "express";
import { runMlPipeline } from "../services/ml/ml-pipeline.service.js";

export async function runPipeline(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await runMlPipeline();

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}