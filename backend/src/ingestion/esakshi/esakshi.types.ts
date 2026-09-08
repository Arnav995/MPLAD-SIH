export interface EsakshiTilesReportRequest {
  combo: string;
  key: string;
}

export type EsakshiRawResponse = Record<string, unknown>;

export interface AllocatedLimitRecord{
     STATE_NAME: string;
     HOUSE_OF_PARLIAMENT: string;
     TENURE: string;
     Sno: number;
     MP_NAME: string;
     HOUSE_NAME: string;
     CONSTITUENCY: string;
     ALLOCATED_AMT: number;
     TENURE_START_DATE: string;
     TENURE_END_DATE: string;
}