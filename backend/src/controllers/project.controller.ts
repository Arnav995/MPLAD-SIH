// import type {
//   Request,
//   Response,
//   NextFunction,
// } from "express";

// import {
//   RiskSeverity,
//   RiskSignalType,
//   RiskTier,
//   WorkLifecycleStatus,
// } from "@prisma/client";

// import {
//   findProjects,
//   findProjectById,
// } from "../services/project.service.js";

// export async function getProjectsController(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const page =
//       getNumberQuery(req.query.page) ?? 1;

//     const pageSize =
//       getNumberQuery(req.query.page_size) ?? 10;

//     const result = await findProjects({
//       district:
//         getStringQuery(req.query.district),

//       mp:
//         getStringQuery(req.query.mp),

//       lifecycleStatus:
//         getStringQuery(
//           req.query.lifecycle_status,
//         ) as
//           | WorkLifecycleStatus
//           | undefined,

//       riskTier:
//         getStringQuery(
//           req.query.risk_tier,
//         ) as RiskTier | undefined,

//       minRiskIndex:
//         getNumberQuery(
//           req.query.min_risk_index,
//         ),

//       category:
//         getStringQuery(
//           req.query.category,
//         ),

//       signalType:
//         getStringQuery(
//           req.query.signal_type,
//         ) as RiskSignalType | undefined,

//       signalSeverity:
//         getStringQuery(
//           req.query.signal_severity,
//         ) as RiskSeverity | undefined,

//       page,
//       pageSize,

//       sort:
//         getStringQuery(req.query.sort),
//     });

//     res.json({
//       projects: result.projects,
//       total: result.total,
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// export async function getProjectController(
//   req: Request<{ workId: string }>,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const workId =
//       parseWorkId(req.params.workId);

//     const project =
//       await findProjectById(workId);

//     if (!project) {
//       res.status(404).json({
//         error: "Project not found",
//       });

//       return;
//     }

//     res.json({
//       data: project,
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// function getStringQuery(
//   value: unknown,
// ): string | undefined {
//   if (
//     value === undefined ||
//     value === ""
//   ) {
//     return undefined;
//   }

//   if (typeof value !== "string") {
//     throw new Error(
//       "Query parameter must be a string",
//     );
//   }

//   return value;
// }

// function getNumberQuery(
//   value: unknown,
// ): number | undefined {
//   if (
//     value === undefined ||
//     value === ""
//   ) {
//     return undefined;
//   }

//   const parsed = Number(value);

//   if (!Number.isFinite(parsed)) {
//     throw new Error(
//       "Query parameter must be a valid number",
//     );
//   }

//   return parsed;
// }

// function parseWorkId(
//   value:
//     | string
//     | string[]
//     | undefined,
// ): number {
//   const idStr = Array.isArray(value)
//     ? value[0]
//     : value;

//   if (
//     idStr === undefined ||
//     !/^\d+$/.test(idStr)
//   ) {
//     throw new Error("Invalid workId");
//   }

//   const workId = Number(idStr);

//   if (
//     !Number.isSafeInteger(workId) ||
//     workId < 1
//   ) {
//     throw new Error("Invalid workId");
//   }

//   return workId;
// }
// // import {
// //   Prisma,
// //   WorkLifecycleStatus,
// //   RiskTier,
// //   RiskSignalType,
// //   RiskSeverity,
// // } from "@prisma/client";

// // import { prisma } from "../db/prisma.js";

// // export interface ProjectListFilters {
// //   district?: string;
// //   mp?: string;
// //   lifecycleStatus?: WorkLifecycleStatus;
// //   riskTier?: RiskTier;
// //   minRiskIndex?: number;
// //   category?: string;
// //   signalType?: RiskSignalType;
// //   signalSeverity?: RiskSeverity;
// //   page: number;
// //   pageSize: number;
// //   sort?: string;
// // }

// // export async function findProjects(
// //   filters: ProjectListFilters,
// // ) {
// //   const where: Prisma.WorkWhereInput = {};

// //   if (filters.lifecycleStatus) {
// //     where.lifecycleStatus =
// //       filters.lifecycleStatus;
// //   }

// //   if (filters.category) {
// //     where.category = {
// //       contains: filters.category,
// //       mode: "insensitive",
// //     };
// //   }

// //   if (filters.district) {
// //     where.district = {
// //       name: {
// //         contains: filters.district,
// //         mode: "insensitive",
// //       },
// //     };
// //   }

// //   if (filters.mp) {
// //     where.mp = {
// //       name: {
// //         contains: filters.mp,
// //         mode: "insensitive",
// //       },
// //     };
// //   }

// //   if (
// //     filters.riskTier ||
// //     filters.minRiskIndex !== undefined
// //   ) {
// //     where.riskAssessment = {};

// //     if (filters.riskTier) {
// //       where.riskAssessment.tier =
// //         filters.riskTier;
// //     }

// //     if (
// //       filters.minRiskIndex !== undefined
// //     ) {
// //       where.riskAssessment.riskIndex = {
// //         gte: new Prisma.Decimal(
// //           filters.minRiskIndex,
// //         ),
// //       };
// //     }
// //   }

// //   /*
// //    * Filter projects by their persisted risk signals.
// //    *
// //    * This is what allows:
// //    *
// //    *   ?signal_type=COST_ANOMALY
// //    *   ?signal_severity=HIGH
// //    *
// //    * to work correctly.
// //    */
// //   if (
// //     filters.signalType ||
// //     filters.signalSeverity
// //   ) {
// //     where.riskSignals = {
// //       some: {
// //         ...(filters.signalType
// //           ? {
// //               type: filters.signalType,
// //             }
// //           : {}),
// //         ...(filters.signalSeverity
// //           ? {
// //               severity:
// //                 filters.signalSeverity,
// //             }
// //           : {}),
// //       },
// //     };
// //   }

// //   const orderBy =
// //     getOrderBy(filters.sort);

// //   const skip =
// //     (filters.page - 1) *
// //     filters.pageSize;

// //   const [projects, total] =
// //     await Promise.all([
// //       prisma.work.findMany({
// //         where,

// //         skip,

// //         take: filters.pageSize,

// //         orderBy,

// //         include: {
// //           district: true,
// //           mp: true,
// //           constituency: true,

// //           riskAssessment: true,

// //           riskSignals: {
// //             orderBy: {
// //               detectedAt: "desc",
// //             },

// //             take: 5,
// //           },
// //         },
// //       }),

// //       prisma.work.count({
// //         where,
// //       }),
// //     ]);

// //   return {
// //     projects,
// //     total,
// //   };
// // }

// // function getOrderBy(
// //   sort?: string,
// // ): Prisma.WorkOrderByWithRelationInput {
// //   switch (sort) {
// //     case "risk_asc":
// //       return {
// //         riskAssessment: {
// //           riskIndex: "asc",
// //         },
// //       };

// //     case "risk_desc":
// //       return {
// //         riskAssessment: {
// //           riskIndex: "desc",
// //         },
// //       };

// //     case "amount_asc":
// //       return {
// //         sanctionAmount: "asc",
// //       };

// //     case "amount_desc":
// //       return {
// //         sanctionAmount: "desc",
// //       };

// //     case "newest":
// //       return {
// //         createdAt: "desc",
// //       };

// //     case "oldest":
// //       return {
// //         createdAt: "asc",
// //       };

// //     default:
// //       return {
// //         updatedAt: "desc",
// //       };
// //   }
// // }

// // export async function findProjectById(
// //   workId: number,
// // ) {
// //   return prisma.work.findUnique({
// //     where: {
// //       id: workId,
// //     },

// //     include: {
// //       state: true,
// //       district: true,
// //       constituency: true,
// //       mp: true,
// //       implementingAgency: true,

// //       expenditures: {
// //         orderBy: {
// //           expenditureDate: "desc",
// //         },
// //       },

// //       reviews: {
// //         orderBy: {
// //           createdAt: "desc",
// //         },
// //       },

// //       riskAssessment: true,

// //       riskSignals: {
// //         orderBy: {
// //           detectedAt: "desc",
// //         },
// //       },

// //       duplicateCandidatesA: {
// //         include: {
// //           workB: true,
// //         },
// //       },

// //       duplicateCandidatesB: {
// //         include: {
// //           workA: true,
// //         },
// //       },
// //     },
// //   });
// // }


// // // import type {
// // //   Request,
// // //   Response,
// // //   NextFunction,
// // // } from "express";

// // // import {
// // //   RiskSeverity,
// // //   RiskSignalType,
// // //   RiskTier,
// // //   WorkLifecycleStatus,
// // // } from "@prisma/client";

// // // import {
// // //   toProjectListItem,
// // // } from "../mappers/project.mapper.js";

// // // import {
// // //   findProjects,
// // //   findProjectById,
// // // } from "../services/project.service.js";

// // // export async function getProjectsController(
// // //   req: Request,
// // //   res: Response,
// // //   next: NextFunction,
// // // ): Promise<void> {
// // //   try {
// // //     const page =
// // //       getNumberQuery(req.query.page) ?? 1;

// // //     const pageSize =
// // //       getNumberQuery(req.query.page_size) ?? 10;

// // //     /*
// // //      * Prevent accidental pathological requests.
// // //      */
// // //     if (page < 1) {
// // //       throw new Error(
// // //         "page must be >= 1",
// // //       );
// // //     }

// // //     if (pageSize < 1) {
// // //       throw new Error(
// // //         "page_size must be >= 1",
// // //       );
// // //     }

// // //     /*
// // //      * Keep page size bounded.
// // //      */
// // //     const safePageSize =
// // //       Math.min(pageSize, 5000);

// // //     const riskTier =
// // //       getStringQuery(
// // //         req.query.risk_tier,
// // //       ) as RiskTier | undefined;

// // //     const lifecycleStatus =
// // //       getStringQuery(
// // //         req.query.lifecycle_status,
// // //       ) as
// // //         | WorkLifecycleStatus
// // //         | undefined;

// // //     const signalType =
// // //       getStringQuery(
// // //         req.query.signal_type,
// // //       ) as
// // //         | RiskSignalType
// // //         | undefined;

// // //     const signalSeverity =
// // //       getStringQuery(
// // //         req.query.signal_severity,
// // //       ) as
// // //         | RiskSeverity
// // //         | undefined;

// // //     /*
// // //      * Validate enum values before they reach Prisma.
// // //      */
// // //     if (
// // //       riskTier !== undefined &&
// // //       !Object.values(RiskTier).includes(
// // //         riskTier,
// // //       )
// // //     ) {
// // //       throw new Error(
// // //         `Invalid risk_tier: ${riskTier}`,
// // //       );
// // //     }

// // //     if (
// // //       lifecycleStatus !== undefined &&
// // //       !Object.values(
// // //         WorkLifecycleStatus,
// // //       ).includes(lifecycleStatus)
// // //     ) {
// // //       throw new Error(
// // //         `Invalid lifecycle_status: ${lifecycleStatus}`,
// // //       );
// // //     }

// // //     if (
// // //       signalType !== undefined &&
// // //       !Object.values(
// // //         RiskSignalType,
// // //       ).includes(signalType)
// // //     ) {
// // //       throw new Error(
// // //         `Invalid signal_type: ${signalType}`,
// // //       );
// // //     }

// // //     if (
// // //       signalSeverity !== undefined &&
// // //       !Object.values(
// // //         RiskSeverity,
// // //       ).includes(signalSeverity)
// // //     ) {
// // //       throw new Error(
// // //         `Invalid signal_severity: ${signalSeverity}`,
// // //       );
// // //     }

// // //     const result =
// // //       await findProjects({
// // //         district:
// // //           getStringQuery(
// // //             req.query.district,
// // //           ),

// // //         mp:
// // //           getStringQuery(
// // //             req.query.mp,
// // //           ),

// // //         lifecycleStatus,

// // //         riskTier,

// // //         minRiskIndex:
// // //           getNumberQuery(
// // //             req.query.min_risk_index,
// // //           ),

// // //         category:
// // //           getStringQuery(
// // //             req.query.category,
// // //           ),

// // //         signalType,

// // //         signalSeverity,

// // //         page,

// // //         pageSize: safePageSize,

// // //         sort:
// // //           getStringQuery(
// // //             req.query.sort,
// // //           ),
// // //       });

// // //     res.json({
// // //       projects:
// // //         result.projects.map(
// // //           toProjectListItem,
// // //         ),

// // //       total: result.total,
// // //     });
// // //   } catch (error) {
// // //     next(error);
// // //   }
// // // }

// // // export async function getProjectController(
// // //   req: Request<{
// // //     workId: string;
// // //   }>,
// // //   res: Response,
// // //   next: NextFunction,
// // // ): Promise<void> {
// // //   try {
// // //     const workId =
// // //       parseWorkId(
// // //         req.params.workId,
// // //       );

// // //     const project =
// // //       await findProjectById(
// // //         workId,
// // //       );

// // //     if (!project) {
// // //       res.status(404).json({
// // //         error: "Project not found",
// // //       });

// // //       return;
// // //     }

// // //     res.json({
// // //       data: project,
// // //     });
// // //   } catch (error) {
// // //     next(error);
// // //   }
// // // }

// // // /* -------------------------------------------------------------------------- */
// // // /* Query helpers                                                             */
// // // /* -------------------------------------------------------------------------- */

// // // function getStringQuery(
// // //   value: unknown,
// // // ): string | undefined {
// // //   if (
// // //     value === undefined ||
// // //     value === null ||
// // //     value === ""
// // //   ) {
// // //     return undefined;
// // //   }

// // //   if (
// // //     typeof value !== "string"
// // //   ) {
// // //     throw new Error(
// // //       "Query parameter must be a string",
// // //     );
// // //   }

// // //   return value;
// // // }

// // // function getNumberQuery(
// // //   value: unknown,
// // // ): number | undefined {
// // //   if (
// // //     value === undefined ||
// // //     value === null ||
// // //     value === ""
// // //   ) {
// // //     return undefined;
// // //   }

// // //   const parsed =
// // //     Number(value);

// // //   if (
// // //     !Number.isFinite(parsed)
// // //   ) {
// // //     throw new Error(
// // //       "Query parameter must be a valid number",
// // //     );
// // //   }

// // //   return parsed;
// // // }

// // // function parseWorkId(
// // //   value:
// // //     | string
// // //     | string[]
// // //     | undefined,
// // // ): number {
// // //   const idStr =
// // //     Array.isArray(value)
// // //       ? value[0]
// // //       : value;

// // //   if (
// // //     idStr === undefined ||
// // //     !/^\d+$/.test(idStr)
// // //   ) {
// // //     throw new Error(
// // //       "Invalid workId",
// // //     );
// // //   }

// // //   const workId =
// // //     Number(idStr);

// // //   if (
// // //     !Number.isSafeInteger(
// // //       workId,
// // //     ) ||
// // //     workId < 1
// // //   ) {
// // //     throw new Error(
// // //       "Invalid workId",
// // //     );
// // //   }

// // //   return workId;
// // // }






import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  RiskSeverity,
  RiskSignalType,
  RiskTier,
  WorkLifecycleStatus,
} from "@prisma/client";

import { toProjectListItem } from "../mappers/project.mapper.js";

import {
  findProjects,
  findProjectById,
} from "../services/project.service.js";

export async function getProjectsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page =
      getNumberQuery(req.query.page) ?? 1;

    const pageSize =
      getNumberQuery(req.query.page_size) ?? 10;

    const result = await findProjects({
      district: getStringQuery(
        req.query.district,
      ),

      mp: getStringQuery(req.query.mp),

      lifecycleStatus: getStringQuery(
        req.query.lifecycle_status,
      ) as WorkLifecycleStatus | undefined,

      riskTier: getStringQuery(
        req.query.risk_tier,
      ) as RiskTier | undefined,

      minRiskIndex: getNumberQuery(
        req.query.min_risk_index,
      ),

      category: getStringQuery(
        req.query.category,
      ),

      signalType: getStringQuery(
        req.query.signal_type,
      ) as RiskSignalType | undefined,

      signalSeverity: getStringQuery(
        req.query.signal_severity,
      ) as RiskSeverity | undefined,

      page,
      pageSize,

      sort: getStringQuery(
        req.query.sort,
      ),
    });

    res.json({
      projects: result.projects.map(
        toProjectListItem,
      ),
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectController(
  req: Request<{ workId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workId = parseWorkId(
      req.params.workId,
    );

    const project =
      await findProjectById(workId);

    if (!project) {
      res.status(404).json({
        error: "Project not found",
      });

      return;
    }

    res.json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

function getStringQuery(
  value: unknown,
): string | undefined {
  if (
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(
      "Query parameter must be a string",
    );
  }

  return value;
}

function getNumberQuery(
  value: unknown,
): number | undefined {
  if (
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      "Query parameter must be a valid number",
    );
  }

  return parsed;
}

function parseWorkId(
  value: string | string[] | undefined,
): number {
  const idStr = Array.isArray(value)
    ? value[0]
    : value;

  if (
    idStr === undefined ||
    !/^\d+$/.test(idStr)
  ) {
    throw new Error("Invalid workId");
  }

  const workId = Number(idStr);

  if (
    !Number.isSafeInteger(workId) ||
    workId < 1
  ) {
    throw new Error("Invalid workId");
  }

  return workId;
}