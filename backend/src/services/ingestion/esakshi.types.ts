export interface WorksCompletedRecord {
  WORK_ID: number;
  WORK_RECOMMENDATION_DTL_ID: number;
  ACTIVITY_NAME: string;
  ACTUAL_AMOUNT: number | null;
  ACTUAL_END_DATE: string | null;
  STATE_NAME: string;
  IDA_NAME: string;
  MP_NAME: string;
  CONSTITUENCY: string;
  AVERAGE_RATING: number | null;
}