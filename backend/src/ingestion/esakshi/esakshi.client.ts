import axios, {
  type AxiosInstance,
  type AxiosResponse,
} from "axios";

import https from "node:https";

import { env } from "../../config/env.js";

import { EsakshiRequestError } from "./esakshi.errors.js";

import type {
  EsakshiTilesReportRequest,
  EsakshiRawResponse,
} from "./esakshi.types.js";

export default class EsakshiClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.ESAKSHI_BASE_URL,

      timeout: env.ESAKSHI_TIMEOUT_MS,

      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
      }),

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/128.0.0.0 Safari/537.36",

        Accept: "application/json, text/plain, */*",

        "Accept-Language": "en-US,en;q=0.9",

        "Content-Type": "application/json; charset=UTF-8",

        Origin:
          "https://www.mplads.mospi.gov.in",

        Referer:
          "https://www.mplads.mospi.gov.in/portal/PreLogin/Dashboard",

        "X-Requested-With": "XMLHttpRequest",

        "sec-ch-ua":
          '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',

        "sec-ch-ua-mobile": "?0",

        "sec-ch-ua-platform": '"Windows"',

        "Sec-Fetch-Dest": "empty",

        "Sec-Fetch-Mode": "cors",

        "Sec-Fetch-Site": "same-origin",
      },
    });
  }

  async getTilesReportData(
    combo: string,
    key: string,
  ): Promise<EsakshiRawResponse> {
    const payload: EsakshiTilesReportRequest = {
      combo,
      key,
    };

    try {
      const response: AxiosResponse<EsakshiRawResponse> =
        await this.http.post(
          "/rest/PreLoginDashboardData/getTilesReportData",
          payload,
        );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new EsakshiRequestError(
          `eSAKSHI request failed: ${error.message}`,
          error.response?.status,
          error.code ?? "UNKNOWN_ERROR",
        );
      }

      throw error;
    }
  }
  async getTilesReportDataRaw(
  combo: string,
  key: string,
): Promise<EsakshiRawResponse> {
  return this.getTilesReportData(combo, key);
}
}