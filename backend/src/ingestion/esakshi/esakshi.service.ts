import EsakshiClient from "./esakshi.client.js";

import {
  parseTilesReportData,
} from "./esakshi.parser.js";

import { ESAKSHI_REPORTS, type EsakshiReportName} from "./esakshi.reports.js";

import type { AllocatedLimitRecord } from "./esakshi.types.js";

export class EsakshiService {
  constructor(
    private readonly client = new EsakshiClient(),
  ) {}
  async fetchReport<T>(
     reportName: EsakshiReportName,
     combo: string,
  ): Promise<T[]>{
     const report = ESAKSHI_REPORTS[reportName];

     const rawResponse = await this.client.getTilesReportData(combo, report.requestKey,);
     
     return parseTilesReportData<T>(rawResponse, report.responseKey);
  }

  async fetchAllocatedLimit(
    combo = "0,0,0,2",
  ): Promise<AllocatedLimitRecord[]> {

          return this.fetchReport<AllocatedLimitRecord>(
               "allocatedLimit",
               combo
          );
//     const key = "Allocated Limit";
//
//     const rawResponse =
//       await this.client.getTilesReportData(
//         combo,
//         key,
//       );

//     return parseTilesReportData<AllocatedLimitRecord>(
//       rawResponse,
//       key,
//     );

  }
}