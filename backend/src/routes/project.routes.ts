import {
  Router,
} from "express";

import {
  getProjectsController,
  getProjectController,
} from "../controllers/project.controller.js";

const router = Router();

router.get(
  "/projects",
  getProjectsController,
);

router.get(
  "/projects/:workId",
  getProjectController,
);

export default router;