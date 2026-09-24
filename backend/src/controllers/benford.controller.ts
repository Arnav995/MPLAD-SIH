import type { Request, Response } from "express";
import { runBenfordPipeline } from "../services/benford/benford-pipeline.service.js";

export async function getBenfordAnalysis(
  req: Request,
  res: Response,
) {
  try {
    const result = await runBenfordPipeline();
    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Benford analysis failed",
    });
  }
}