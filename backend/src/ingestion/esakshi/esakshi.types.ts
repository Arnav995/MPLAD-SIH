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
export interface WorksCompletedRecord {
  WORK_CATEGORY: string;
  ACTIVITY_NAME: string;
  STATE_NAME: string;
  IDA_NAME: string;
  WORK_DESCRIPTION: string;
  MP_NAME: string;
  FLAG: number;
  CONSTITUENCY_ID: number;
  LETTER_NO: string;
  ACTUAL_AMOUNT: number;
  Sno: number;
  CONSTITUENCY: string;
  ACTUAL_END_DATE: string;
  WORK_RECOMMENDATION_DTL_ID: number;
  WORK_ID: number;
  AVERAGE_RATING: number;
}