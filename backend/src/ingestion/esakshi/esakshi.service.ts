import EsakshiClient from "./esakshi.client.js";

import {
  parseTilesReportData,
} from "./esakshi.parser.js";

import type {
  AllocatedLimitRecord,
} from "./esakshi.types.js";

export class EsakshiService {
  constructor(
    private readonly client = new EsakshiClient(),
  ) {}

  async fetchAllocatedLimit(
    combo = "0,0,0,2",
  ): Promise<AllocatedLimitRecord[]> {
    const key = "Allocated Limit";

    const rawResponse =
      await this.client.getTilesReportData(
        combo,
        key,
      );

    return parseTilesReportData<AllocatedLimitRecord>(
      rawResponse,
      key,
    );
  }
}