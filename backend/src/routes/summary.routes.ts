import { Router } from "express";

import {
  getSummaryController,
  getDistrictSummariesController,
  getMpSummariesController,
} from "../controllers/summary.controller.js";

const router = Router();

router.get(
  "/summary",
  getSummaryController,
);

router.get(
  "/summary/districts",
  getDistrictSummariesController,
);

router.get(
  "/summary/mps",
  getMpSummariesController,
);

export default router;