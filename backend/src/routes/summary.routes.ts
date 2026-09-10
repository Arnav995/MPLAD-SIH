import {
  Router,
} from "express";

import {
  getSummaryController,
} from "../controllers/summary.controller.js";

const router = Router();

router.get(
  "/summary",
  getSummaryController,
);

export default router;