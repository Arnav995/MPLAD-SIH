import { Prisma } from "@prisma/client";

export interface CostSignal {
  severity: number;
  reason: string;
  evidence: Record<string, unknown>;
}

export function detectCostAnomaly(work: {
  sanctionAmount: Prisma.Decimal | null;
  actualAmount: Prisma.Decimal | null;
}): CostSignal | null {
  if (
    work.sanctionAmount == null ||
    work.actualAmount == null
  ) {
    return null;
  }

  const sanction = Number(work.sanctionAmount);
  const actual = Number(work.actualAmount);

  if (
    !Number.isFinite(sanction) ||
    !Number.isFinite(actual) ||
    sanction <= 0
  ) {
    return null;
  }

  if (actual <= sanction) {
    return null;
  }

  const excessPercent =
    ((actual - sanction) / sanction) * 100;

  const severity =
    excessPercent >= 20
      ? 35
      : excessPercent >= 10
        ? 25
        : 15;

  return {
    severity,
    reason: `Actual expenditure exceeds the sanctioned amount by ${excessPercent.toFixed(1)}%.`,
    evidence: {
      sanctionAmount: sanction,
      actualAmount: actual,
      excessPercent: Number(excessPercent.toFixed(2)),
    },
  };
}