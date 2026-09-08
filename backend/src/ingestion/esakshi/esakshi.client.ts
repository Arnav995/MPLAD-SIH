import axios, { type AxiosInstance, type AxiosResponse } from "axios";

import { EsakshiRequestError } from "./esakshi.errors.js";

import type {
  EsakshiTilesReportRequest,
  EsakshiRawResponse,
} from "./esakshi.types.js";

export default class EsakshiClient {
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = process.env.ESAKSHI_BASE_URL;

    if (!baseURL) {
      throw new Error("ESAKSHI_BASE_URL is missing in env vars");
    }

    this.http = axios.create({
      baseURL,
      timeout: Number(process.env.ESAKSHI_TIMEOUT_MS ?? 30_000),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
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

    const response: AxiosResponse<EsakshiRawResponse> =
      await this.http.post(
        "/rest/PreLoginDashboardData/getTilesReportData",
        payload,
      );

    return response.data;
  }
}