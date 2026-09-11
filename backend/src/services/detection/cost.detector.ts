import { Prisma } from "@prisma/client";

export interface CostSignal {
  severity: number;
  reason: string;
  evidence: Record<string, unknown>;
}

export interface CostDetectionWork {
  workId: number;
  category: string | null;
  sanctionAmount: Prisma.Decimal | null;
  expenditureTotal: Prisma.Decimal;
  categoryThreshold: Prisma.Decimal | null;
}

export function detectCostAnomaly(
  work: CostDetectionWork,
): (CostSignal & { workId: number }) | null {
  if (work.sanctionAmount == null) {
    return null;
  }

  const sanction = Number(work.sanctionAmount);
  const expenditure = Number(work.expenditureTotal);
  const threshold =
    work.categoryThreshold == null
      ? null
      : Number(work.categoryThreshold);

  if (
    !Number.isFinite(sanction) ||
    !Number.isFinite(expenditure) ||
    !Number.isFinite(threshold ?? 0)
  ) {
    return null;
  }

  if (sanction <= 0 || expenditure <= 0 || threshold == null) {
    return null;
  }

  if (expenditure <= threshold) {
    return null;
  }

  const excessAmount = expenditure - threshold;
  const excessPercent = (excessAmount / threshold) * 100;

  /*
   * P99 expenditure is used as the MVP cost anomaly boundary.
   *
   * Severity:
   * 25 = expenditure is above the P99 threshold
   * 35 = expenditure is more than 2x the P99 threshold
   */
  const severity = expenditure >= threshold * 2 ? 35 : 25;

  const category = work.category ?? "UNKNOWN";

  return {
    workId: work.workId,
    severity,
    reason:
      `Expenditure of ₹${expenditure.toLocaleString("en-IN")} ` +
      `is unusually high for category "${category}", ` +
      `exceeding the category cost threshold of ` +
      `₹${threshold.toLocaleString("en-IN")} by ` +
      `${excessPercent.toFixed(1)}%.`,
    evidence: {
      category,
      sanctionAmount: sanction,
      expenditureAmount: expenditure,
      categoryThreshold: threshold,
      excessAmount: Number(excessAmount.toFixed(2)),
      excessPercent: Number(excessPercent.toFixed(2)),
      thresholdMethod: "category_p99",
    },
  };
}