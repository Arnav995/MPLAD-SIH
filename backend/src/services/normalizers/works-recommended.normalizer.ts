import { Prisma } from "@prisma/client";

import type { WorksRecommendedRecord } from "../../ingestion/esakshi/esakshi.types.js";
import { parseEsakshiDate } from "./date.utils.js";
import { mapLifecycleStatus } from "./lifecycle.utils.js";

export function normalizeWorksRecommended(
  record: WorksRecommendedRecord,
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

    activityName: record.ACTIVITY_NAME || null,
    category: record.WORK_CATEGORY || null,
    description: record.WORK_DESCRIPTION || null,

    stateNameFromSource: record.STATE_NAME || null,
    constituencyNameFromSource:
      record.CONSTITUENCY || null,
    mpNameFromSource: record.MP_NAME || null,
    idaNameFromSource: record.IDA_NAME || null,

    lifecycleStatus: mapLifecycleStatus(
      record.WORK_STAGE,
    ),

    recommendationDate: parseEsakshiDate(
      record.RECOMMENDATION_DATE,
    ),

    sanctionDate: parseEsakshiDate(
      record.SANCTION_DATE,
    ),

    recommendedAmount:
      record.RECOMMENDED_AMOUNT == null
        ? null
        : new Prisma.Decimal(
            record.RECOMMENDED_AMOUNT,
          ),

    sanctionAmount:
      record.SANCTION_AMOUNT == null
        ? null
        : new Prisma.Decimal(
            record.SANCTION_AMOUNT,
          ),

    letterNo: record.LETTER_NO || null,
    flag: record.FLAG ?? null,
  };
}