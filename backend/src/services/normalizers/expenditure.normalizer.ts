import { Prisma } from "@prisma/client";

import type { ExpenditureRecord } from "../../ingestion/esakshi/esakshi.types.js";
import { parseEsakshiDate } from "./date.utils.js";

export function normalizeExpenditure(
  record: ExpenditureRecord,
) {
  if (
    record.WORK_RECOMMENDATION_DTL_ID == null ||
    !Number.isFinite(
      record.WORK_RECOMMENDATION_DTL_ID,
    )
  ) {
    return null;
  }

  return {
    workRecommendationDtlId: BigInt(
      record.WORK_RECOMMENDATION_DTL_ID,
    ),

    amount:
      record.FUND_DISBURSED_AMT == null
        ? null
        : new Prisma.Decimal(
            record.FUND_DISBURSED_AMT,
          ),

    expenditureDate:
      parseEsakshiDate(
        record.EXPENDITURE_DATE,
      ),

    workStatus:
      record.WORK_STATUS || null,

    activityName:
      record.ACTIVITY_NAME || null,

    vendorNameFromSource:
      record.VENDOR_NAME || null,

    iaNameFromSource:
      record.IA_NAME || null,

    constituencyFromSource:
      record.CONSTITUENCY || null,

    mpNameFromSource:
      record.MP_NAME || null,

    vendorEsakshiId:
      record.VENDOR_ID == null
        ? null
        : record.VENDOR_ID,
  };
}