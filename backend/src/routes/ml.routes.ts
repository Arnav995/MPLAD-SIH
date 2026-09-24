import { Router } from "express";
import { runPipeline } from "../controllers/ml.controller.js";

const router = Router();

router.post("/run", runPipeline);

export default router;