import type {
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
  updateCompletedWork,
  upsertRecommendedWork,
} from "../../repositories/work.repository.js";

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
}