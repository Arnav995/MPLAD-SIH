import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  findDuplicates,
} from "../services/duplicate.service.js";

export async function getDuplicatesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page =
      getNumberQuery(req.query.page) ?? 1;

    const pageSize =
      getNumberQuery(req.query.page_size) ?? 20;

    const minScore =
      getNumberQuery(req.query.min_score);

    if (page < 1 || !Number.isInteger(page)) {
      throw new Error("page must be a positive integer");
    }

    if (
      pageSize < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize > 100
    ) {
      throw new Error(
        "page_size must be an integer between 1 and 100",
      );
    }

    const result = await findDuplicates({
      minScore,
      page,
      pageSize,
    });

    res.json({
      duplicates: result.duplicates.map(
        toDuplicateItem,
      ),
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
}

function toDuplicateItem(
  duplicate: any,
) {
  return {
    candidate_id: duplicate.id,
    suspicion_score:
      duplicate.suspicionScore?.toString() ?? "0",
    text_similarity:
      duplicate.textSimilarity?.toString() ?? null,

    work_a: {
      work_id: duplicate.workA.id,
      activity_name:
        duplicate.workA.activityName,
      description:
        duplicate.workA.description,
      category:
        duplicate.workA.category,
      constituency:
        duplicate.workA
          .constituencyNameFromSource,
      mp_name:
        duplicate.workA.mpNameFromSource,
      recommended_amount:
        duplicate.workA.recommendedAmount?.toString() ??
        null,
      sanction_amount:
        duplicate.workA.sanctionAmount?.toString() ??
        null,
    },

    work_b: {
      work_id: duplicate.workB.id,
      activity_name:
        duplicate.workB.activityName,
      description:
        duplicate.workB.description,
      category:
        duplicate.workB.category,
      constituency:
        duplicate.workB
          .constituencyNameFromSource,
      mp_name:
        duplicate.workB.mpNameFromSource,
      recommended_amount:
        duplicate.workB.recommendedAmount?.toString() ??
        null,
      sanction_amount:
        duplicate.workB.sanctionAmount?.toString() ??
        null,
    },
  };
}

function getNumberQuery(
  value: unknown,
): number | undefined {
  if (value === undefined || value === "") {
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