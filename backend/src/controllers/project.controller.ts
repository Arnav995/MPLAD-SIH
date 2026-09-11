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