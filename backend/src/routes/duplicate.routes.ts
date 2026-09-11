import { Router } from "express";

import {
  getDuplicatesController,
} from "../controllers/duplicate.controller.js";

const router = Router();

router.get(
  "/duplicates",
  getDuplicatesController,
);

export default router;