import { Prisma, WorkLifecycleStatus } from "@prisma/client";

import type { WorksCompletedRecord } from "../../ingestion/esakshi/esakshi.types.js";
import { parseEsakshiDate } from "./date.utils.js";

export function normalizeWorksCompleted(
  record: WorksCompletedRecord,
) {
  if (
    record.WORK_RECOMMENDATION_DTL_ID == null ||
    !Number.isFinite(record.WORK_RECOMMENDATION_DTL_ID)
  ) {
    return null;
  }

  return {
    recommendationDtlId: BigInt(
      record.WORK_RECOMMENDATION_DTL_ID,
    ),

    workId:
      record.WORK_ID == null
        ? null
        : BigInt(record.WORK_ID),

    activityName: record.ACTIVITY_NAME || null,

    actualAmount:
      record.ACTUAL_AMOUNT == null
        ? null
        : new Prisma.Decimal(record.ACTUAL_AMOUNT),

    completionDate: parseEsakshiDate(
      record.ACTUAL_END_DATE,
    ),

    stateNameFromSource: record.STATE_NAME || null,
    constituencyNameFromSource:
      record.CONSTITUENCY || null,
    mpNameFromSource: record.MP_NAME || null,
    idaNameFromSource: record.IDA_NAME || null,

    averageRating:
      record.AVERAGE_RATING == null
        ? null
        : new Prisma.Decimal(record.AVERAGE_RATING),

    lifecycleStatus: WorkLifecycleStatus.COMPLETED,
  };
}