// import { Router } from "express";

// import {
//   getProjectsController,
//   getProjectController,
// } from "../controllers/project.controller.js";

// const router = Router();

// router.get(
//   "/projects",
//   getProjectsController,
// );

// router.get(
//   "/projects/:workId",
//   getProjectController,
// );

// export default router;

// // import {
// //   Router,
// // } from "express";

// // import {
// //   getProjectsController,
// //   getProjectController,
// // } from "../controllers/project.controller.js";

// // const router = Router();

// // /*
// //  * GET /api/projects
// //  *
// //  * Supported query parameters:
// //  *
// //  *   district
// //  *   mp
// //  *   lifecycle_status
// //  *   risk_tier
// //  *   min_risk_index
// //  *   category
// //  *   signal_type
// //  *   signal_severity
// //  *   page
// //  *   page_size
// //  *   sort
// //  */
// // router.get(
// //   "/projects",
// //   getProjectsController,
// // );

// // /*
// //  * GET /api/projects/:workId
// //  */
// // router.get(
// //   "/projects/:workId",
// //   getProjectController,
// // );

// // export default router;




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