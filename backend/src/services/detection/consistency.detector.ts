import { WorkLifecycleStatus } from "@prisma/client";

export interface ConsistencySignal {
  rule: string;
  severity: number;
  reason: string;
}

export function detectConsistencyIssues(work: {
  lifecycleStatus: WorkLifecycleStatus;
  recommendationDate: Date | null;
  sanctionDate: Date | null;
  completionDate: Date | null;
  recommendedAmount: unknown;
  sanctionAmount: unknown;
  actualAmount: unknown;
}): ConsistencySignal[] {
  const signals: ConsistencySignal[] = [];

  if (
    work.completionDate &&
    work.recommendationDate &&
    work.completionDate < work.recommendationDate
  ) {
    signals.push({
      rule: "COMPLETION_BEFORE_RECOMMENDATION",
      severity: 30,
      reason:
        "Completion date occurs before the recommendation date.",
    });
  }

  if (
    work.sanctionDate &&
    work.recommendationDate &&
    work.sanctionDate < work.recommendationDate
  ) {
    signals.push({
      rule: "SANCTION_BEFORE_RECOMMENDATION",
      severity: 25,
      reason:
        "Sanction date occurs before the recommendation date.",
    });
  }

  if (
    work.completionDate &&
    work.sanctionDate &&
    work.completionDate < work.sanctionDate
  ) {
    signals.push({
      rule: "COMPLETION_BEFORE_SANCTION",
      severity: 30,
      reason:
        "Completion date occurs before the sanction date.",
    });
  }

  if (
    work.actualAmount != null &&
    work.sanctionAmount != null &&
    Number(work.actualAmount) > Number(work.sanctionAmount)
  ) {
    signals.push({
      rule: "ACTUAL_AMOUNT_EXCEEDS_SANCTION",
      severity: 30,
      reason:
        "Actual expenditure exceeds the sanctioned amount.",
    });
  }

  if (
    work.lifecycleStatus === WorkLifecycleStatus.COMPLETED &&
    !work.completionDate
  ) {
    signals.push({
      rule: "COMPLETED_WITHOUT_COMPLETION_DATE",
      severity: 20,
      reason:
        "Work is marked completed but has no completion date.",
    });
  }

  return signals;
}