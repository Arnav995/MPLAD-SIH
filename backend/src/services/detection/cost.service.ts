import {
  Prisma,
  RiskSeverity,
  RiskSignalType,
} from "@prisma/client";

import { prisma } from "../../db/prisma.js";

import { detectCostAnomaly } from "./cost.detector.js";

export async function runCostDetection() {
  const works = await prisma.work.findMany({
    where: {
      sanctionAmount: {
        not: null,
      },
    },
    select: {
      id: true,
      category: true,
      sanctionAmount: true,
      expenditures: {
        select: {
          amount: true,
        },
      },
    },
  });

  const expenditureRows = works
    .map((work) => {
      const expenditureTotal = work.expenditures.reduce(
        (total, expenditure) =>
          total + Number(expenditure.amount ?? 0),
        0,
      );

      return {
        workId: work.id,
        category: work.category ?? "UNKNOWN",
        expenditureTotal,
      };
    })
    .filter(
      (row) =>
        row.expenditureTotal > 0 &&
        Number.isFinite(row.expenditureTotal),
    );

  const percentile = (values: number[], p: number) => {
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((sorted.length - 1) * p);

    return sorted[index];
  };

  const overallExpenditures = expenditureRows.map(
    (row) => row.expenditureTotal,
  );

  const overallP99 = percentile(overallExpenditures, 0.99);

  const categoryValues = new Map<string, number[]>();

  for (const row of expenditureRows) {
    const values = categoryValues.get(row.category) ?? [];

    values.push(row.expenditureTotal);

    categoryValues.set(row.category, values);
  }

  const categoryThresholds = new Map<string, number>();

  for (const [category, values] of categoryValues.entries()) {
    const threshold =
      values.length >= 30
        ? percentile(values, 0.99)
        : overallP99;

    if (threshold != null) {
      categoryThresholds.set(category, threshold);
    }
  }

  let worksChecked = 0;
  let signalsCreated = 0;

  for (const work of works) {
    worksChecked += 1;

    await prisma.riskSignal.deleteMany({
      where: {
        workId: work.id,
        type: RiskSignalType.COST_ANOMALY,
      },
    });

    const expenditureTotal = work.expenditures.reduce(
      (total, expenditure) =>
        total + Number(expenditure.amount ?? 0),
      0,
    );

    const category = work.category ?? "UNKNOWN";

    const categoryThreshold =
      categoryThresholds.get(category) ??
      overallP99;

    if (categoryThreshold == null) {
      continue;
    }

    const signal = detectCostAnomaly({
      workId: work.id,
      category,
      sanctionAmount: work.sanctionAmount,
      expenditureTotal: new Prisma.Decimal(expenditureTotal),
      categoryThreshold: new Prisma.Decimal(categoryThreshold),
    });

    if (!signal) {
      continue;
    }

    const severity =
      signal.severity >= 30
        ? RiskSeverity.HIGH
        : RiskSeverity.MEDIUM;

    await prisma.riskSignal.create({
      data: {
        workId: signal.workId,
        type: RiskSignalType.COST_ANOMALY,
        severity,
        score: signal.severity,
        reason: signal.reason,
        evidence:
          signal.evidence as Prisma.InputJsonValue,
      },
    });

    signalsCreated += 1;
  }

  return {
    worksChecked,
    signalsCreated,
  };
}