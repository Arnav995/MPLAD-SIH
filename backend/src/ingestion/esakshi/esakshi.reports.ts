import "dotenv/config";
export interface EsakshiReportConfig {
  requestKey: string;
  responseKey: string;
}

export const ESAKSHI_REPORTS = {
  allocatedLimit: {
    requestKey: "Allocated Limit for Hon'ble MPs",
    responseKey: "Allocated Limit",
  },

  worksRecommended: {
    requestKey: "Works Recommended",
    responseKey: "Total Works Recommended",
  },

  worksSanctioned: {
    requestKey: "Works Sanctioned",
    responseKey: "Works Sanctioned",
  },

  worksCompleted: {
    requestKey: "Works Completed",
    responseKey: "Total Works Completed",
  },

  expenditure: {
    requestKey: "Expenditure on Completed and On-going Works as on Date",
    responseKey: "Expenditure",
  },
  reviews: {
    requestKey: "Reviews",
    responseKey: "Reviews",
  },
} as const;

export type EsakshiReportName = keyof typeof ESAKSHI_REPORTS;