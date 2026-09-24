import { Router } from "express";
import { getBenfordAnalysis } from "../controllers/benford.controller.js";

const router = Router();

router.get("/", getBenfordAnalysis);

export default router;