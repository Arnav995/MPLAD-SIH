import type {
  ExpenditureRecord,
  WorksCompletedRecord,
  WorksRecommendedRecord,
} from "../../ingestion/esakshi/esakshi.types.js";

import { EsakshiService } from "../../ingestion/esakshi/esakshi.service.js";

import {
  normalizeWorksCompleted,
} from "../normalizers/works-completed.normalizer.js";

import {
  normalizeWorksRecommended,
} from "../normalizers/works-recommended.normalizer.js";

import {
  normalizeExpenditure,
} from "../normalizers/expenditure.normalizer.js";

import {
  updateCompletedWork,
  upsertRecommendedWork,
} from "../../repositories/work.repository.js";

import {
  createExpenditure,
  deleteExpendituresForRecommendations,
  findWorkByRecommendationDtlId,
  upsertImplementingAgency,
  upsertVendor,
} from "../../repositories/expenditure.repository.js";

export interface IngestionResult {
  fetched: number;
  processed: number;
  skipped: number;
  unmatched: number;
}

export class EsakshiIngestionService {
  private readonly esakshiService = new EsakshiService();

  async ingestWorksRecommended(
    combo: string,
  ): Promise<IngestionResult> {
    const records =
      await this.esakshiService.fetchReport<WorksRecommendedRecord>(
        "worksRecommended",
        combo,
      );

    let processed = 0;
    let skipped = 0;

    for (const record of records) {
      const normalized =
        normalizeWorksRecommended(record);

      if (!normalized) {
        skipped++;
        continue;
      }

      await upsertRecommendedWork(normalized);
      processed++;
    }

    return {
      fetched: records.length,
      processed,
      skipped,
      unmatched: 0,
    };
  }

  async ingestWorksCompleted(
    combo: string,
  ): Promise<IngestionResult> {
    const records =
      await this.esakshiService.fetchReport<WorksCompletedRecord>(
        "worksCompleted",
        combo,
      );

    let processed = 0;
    let skipped = 0;
    let unmatched = 0;

    for (const record of records) {
      const normalized =
        normalizeWorksCompleted(record);

      if (!normalized) {
        skipped++;
        continue;
      }

      try {
        await updateCompletedWork(normalized);
        processed++;
      } catch {
        unmatched++;
      }
    }

    return {
      fetched: records.length,
      processed,
      skipped,
      unmatched,
    };
  }
  async ingestExpenditure(
  combo: string,
): Promise<IngestionResult> {
  const records =
    await this.esakshiService.fetchReport<ExpenditureRecord>(
      "expenditure",
      combo,
    );

  let processed = 0;
  let skipped = 0;
  let unmatched = 0;

  const normalizedRecords = records
    .map(normalizeExpenditure)
    .filter(
      (
        record,
      ): record is NonNullable<typeof record> =>
        record !== null,
    );

  skipped = records.length - normalizedRecords.length;

  const recommendationIds = [
    ...new Set(
      normalizedRecords.map(
        (record) => record.workRecommendationDtlId,
      ),
    ),
  ];

  // Prevent duplicate rows when the same scope is ingested again.
  await deleteExpendituresForRecommendations(
    recommendationIds,
  );

  for (const record of normalizedRecords) {
    const work =
      await findWorkByRecommendationDtlId(
        record.workRecommendationDtlId,
      );

    if (!work) {
      unmatched++;
      continue;
    }

    let vendorId: number | undefined;

    if (
      record.vendorEsakshiId != null &&
      record.vendorNameFromSource
    ) {
      const vendor = await upsertVendor(
        record.vendorEsakshiId,
        record.vendorNameFromSource,
      );

      vendorId = vendor.id;
    }

    let implementingAgencyId: number | undefined;

    if (record.iaNameFromSource) {
      const agency =
        await upsertImplementingAgency(
          record.iaNameFromSource,
        );

      implementingAgencyId = agency.id;
    }

    await createExpenditure({
      workId: work.id,
      vendorId,
      implementingAgencyId,
      amount: record.amount,
      expenditureDate: record.expenditureDate,
      workStatus: record.workStatus,
      workRecommendationDtlId:
        record.workRecommendationDtlId,
      activityName: record.activityName,
      vendorNameFromSource:
        record.vendorNameFromSource,
      iaNameFromSource:
        record.iaNameFromSource,
      constituencyFromSource:
        record.constituencyFromSource,
      mpNameFromSource:
        record.mpNameFromSource,
    });

    processed++;
  }

  return {
    fetched: records.length,
    processed,
    skipped,
    unmatched,
  };
}

}