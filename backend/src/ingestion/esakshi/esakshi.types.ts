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

export interface WorksRecommendedRecord {
  WORK_CATEGORY: string;
  ACTIVITY_NAME: string;
  STATE_NAME: string;
  HOUSE_OF_PARLIAMENT: number;
  IDA_NAME: string;
  TENURE: string;
  MP_NAME: string;
  WORK_DESCRIPTION: string;
  RECOMMENDATION_DATE: string;
  RECOMMENDED_AMOUNT: number;
  FLAG: number;
  CONSTITUENCY_ID: number;
  WORK_STAGE: string;
  LETTER_NO: string;
  SANCTION_AMOUNT: number;
  Sno: number;
  CONSTITUENCY: string;
  WORK_RECOMMENDATION_DTL_ID: number;
  TENURE_START_DATE: string;
  TENURE_END_DATE: string;
  SANCTION_DATE: string | null;
}

export interface WorksSanctionedRecord {
  WORK_RECOMMENDATION_DTL_ID: number;
  ACTIVITY_NAME?: string;
  WORK_CATEGORY?: string;
  WORK_DESCRIPTION?: string;
  RECOMMENDATION_DATE?: string;
  RECOMMENDED_AMOUNT?: number;
  SANCTION_DATE?: string;
  SANCTION_AMOUNT?: number;
  LETTER_NO?: string;
  IDA_NAME?: string;
  CONSTITUENCY_ID?: number;
  STATE_NAME?: string;
  HOUSE_OF_PARLIAMENT?: string;
  TENURE?: string;
  MP_NAME?: string;
  [key: string]: unknown;
}

export interface ExpenditureRecord {
  WORK_ID?: number;
  WORK_RECOMMENDATION_DTL_ID?: number;
  ACTIVITY_NAME?: string;
  IA_NAME?: string;
  VENDOR_NAME?: string;
  VENDOR_ID?: number;
  FUND_DISBURSED_AMT?: number;
  EXPENDITURE_DATE?: string;
  WORK_STATUS?: string;
  CONSTITUENCY?: string;
  MP_NAME?: string;
  [key: string]: unknown;
}

export interface ReviewRecord {
  WORK_REVIEW_ID?: number;
  WORK_RECOM_DTL_ID?: number;
  STAR_RATING?: number;
  REVIEW_DETAIL?: string;
  [key: string]: unknown;
}