import axios, {
  type AxiosInstance,
} from "axios";
import https from "https";

import {
  ESAKSHI_REPORTS,
  type EsakshiReportName,
} from "./esakshi.reports.js";

import {
  parseTilesReportData,
} from "./esakshi.parser.js";

import {
  EsakshiRequestError,
} from "./esakshi.errors.js";

import type {
  EsakshiRawResponse,
} from "./esakshi.types.js";

export class EsakshiService {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL =
      process.env.ESAKSHI_BASE_URL ??
      "https://www.mplads.mospi.gov.in";

    const timeout =
      Number(process.env.ESAKSHI_TIMEOUT_MS ?? 30000);

    this.client = axios.create({
      baseURL,
      timeout,

      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
      }),

      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      },
    });
  }

  async fetchRawReport(
    reportName: EsakshiReportName,
    combo: string,
  ): Promise<EsakshiRawResponse> {
    const config =
      ESAKSHI_REPORTS[reportName];

    try {
      const response =
        await this.client.post<EsakshiRawResponse>(
          "/rest/PreLoginDashboardData/getTilesReportData",
          {
            combo,
            key: config.requestKey,
          },
        );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new EsakshiRequestError(
          `eSAKSHI request failed: ${
            error.message
          }`,
          error.response?.status,
          error.code,
        );
      }

      throw error;
    }
  }

  async fetchReport<T>(
    reportName: EsakshiReportName,
    combo: string,
  ): Promise<T[]> {
    const config =
      ESAKSHI_REPORTS[reportName];

    const response =
      await this.fetchRawReport(
        reportName,
        combo,
      );

    return parseTilesReportData<T>(
      response,
      config.responseKey,
    );
  }
}
// import EsakshiClient from "./esakshi.client.js";

// import {
//   parseTilesReportData,
// } from "./esakshi.parser.js";

// import { ESAKSHI_REPORTS, type EsakshiReportName} from "./esakshi.reports.js";

// import type { AllocatedLimitRecord } from "./esakshi.types.js";

// export class EsakshiService {
//   constructor(
//     private readonly client = new EsakshiClient(),
//   ) {}
//   async fetchReport<T>(
//      reportName: EsakshiReportName,
//      combo: string,
//   ): Promise<T[]>{
//      const report = ESAKSHI_REPORTS[reportName];

//      const rawResponse = await this.client.getTilesReportData(combo, report.requestKey,);
     
//      return parseTilesReportData<T>(rawResponse, report.responseKey);
//   }

//   async fetchAllocatedLimit(
//     combo = "0,0,0,2",
//   ): Promise<AllocatedLimitRecord[]> {

//           return this.fetchReport<AllocatedLimitRecord>(
//                "allocatedLimit",
//                combo
//           );
// //     const key = "Allocated Limit";
// //
// //     const rawResponse =
// //       await this.client.getTilesReportData(
// //         combo,
// //         key,
// //       );

// //     return parseTilesReportData<AllocatedLimitRecord>(
// //       rawResponse,
// //       key,
// //     );

//   }
// }


















// import axios, { type AxiosInstance, AxiosError } from "axios";
// import https from "https";
// import { CookieJar } from "tough-cookie";
// import { wrapper } from "axios-cookiejar-support";

// import {
//   ESAKSHI_REPORTS,
//   type EsakshiReportName,
// } from "./esakshi.reports.js";

// import { parseTilesReportData } from "./esakshi.parser.js";

// import { EsakshiRequestError } from "./esakshi.errors.js";

// import type { EsakshiRawResponse } from "./esakshi.types.js";

// export class EsakshiService {
//   private readonly client: AxiosInstance;

//   constructor() {
//     const baseURL =
//       process.env.ESAKSHI_BASE_URL ??
//       "https://www.mplads.mospi.gov.in/digigov";

//     const timeout = Number(process.env.ESAKSHI_TIMEOUT_MS ?? 30000);

//     const jar = new CookieJar();

//     // Create standard instance first, then wrap it
//     const axiosInstance = axios.create({
//       baseURL,
//       timeout,
//       httpsAgent: new https.Agent({
//         keepAlive: true,
//         rejectUnauthorized: false,
//       }),
//       headers: {
//         Accept: "application/json, text/plain, */*",
//         "Content-Type": "application/json",
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
//       },
//     });

//     this.client = wrapper(axiosInstance);
    
//     // Attach the jar directly to client defaults
//     this.client.defaults.jar = jar;
//     this.client.defaults.withCredentials = true;
//   }

//   async initializeSession(): Promise<void> {
//     await this.client.get("/Login.zul");
//   }

//   async fetchStates(): Promise<Array<{ STATE_ID: number; STATE_NAME: string }>> {
//     await this.initializeSession();

//     const response = await this.client.post<
//       Array<{ STATE_ID: number; STATE_NAME: string }>
//     >(
//       "/PreLoginDashboardData/getStateData",
//       {},
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return response.data;
//   }

//   async fetchRawReport(
//     reportName: EsakshiReportName,
//     combo: string,
//   ): Promise<EsakshiRawResponse> {
//     const config = ESAKSHI_REPORTS[reportName];

//     try {
//       await this.initializeSession();

//       const response = await this.client.post<EsakshiRawResponse>(
//         "/rest/PreLoginDashboardData/getTilesReportData",
//         {
//           combo,
//           key: config.requestKey,
//         }
//       );

//       return response.data;
//     } catch (error: unknown) {
//       if (axios.isAxiosError(error)) {
//         const axiosError = error as AxiosError;
//         throw new EsakshiRequestError(
//           `eSAKSHI request failed: ${axiosError.message}`,
//           axiosError.response?.status,
//           axiosError.code,
//         );
//       }

//       throw error;
//     }
//   }

//   async fetchReport<T>(
//     reportName: EsakshiReportName,
//     combo: string,
//   ): Promise<T[]> {
//     const config = ESAKSHI_REPORTS[reportName];

//     const response = await this.fetchRawReport(
//       reportName,
//       combo,
//     );

//     return parseTilesReportData<T>(
//       response,
//       config.responseKey,
//     );
//   }
// }