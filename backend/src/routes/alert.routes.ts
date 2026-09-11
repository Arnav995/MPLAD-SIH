import { Router } from "express";

import {
  getTier2DigestController,
} from "../controllers/alert.controller.js";

const router = Router();

router.get(
  "/alerts/tier2-digest",
  getTier2DigestController,
);

export default router;