import {
  RiskSeverity,
  RiskSignalType,
} from "@prisma/client";

import { prisma } from "../../db/prisma.js";

import { detectConsistencyIssues } from "./consistency.detector.js";

export async function runConsistencyDetection() {
  const works = await prisma.work.findMany({
    select: {
      id: true,
      lifecycleStatus: true,
      recommendationDate: true,
      sanctionDate: true,
      completionDate: true,
      recommendedAmount: true,
      sanctionAmount: true,
      actualAmount: true,
      expenditures: {
        select: {
          amount: true,
        },
      },
    },
  });

  let worksChecked = 0;
  let signalsCreated = 0;

  for (const work of works) {
    worksChecked += 1;

    await prisma.riskSignal.deleteMany({
      where: {
        workId: work.id,
        type: RiskSignalType.CROSS_STAGE_CONSISTENCY,
      },
    });

    const expenditureTotal = work.expenditures.reduce(
      (total, expenditure) =>
        total + Number(expenditure.amount ?? 0),
      0,
    );

    const signals = detectConsistencyIssues({
      lifecycleStatus: work.lifecycleStatus,
      recommendationDate: work.recommendationDate,
      sanctionDate: work.sanctionDate,
      completionDate: work.completionDate,
      recommendedAmount: work.recommendedAmount,
      sanctionAmount: work.sanctionAmount,
      actualAmount: work.actualAmount,
      expenditureTotal,
    });

    for (const signal of signals) {
      await prisma.riskSignal.create({
        data: {
          workId: work.id,
          type: RiskSignalType.CROSS_STAGE_CONSISTENCY,
          severity:
            signal.severity >= 30
              ? RiskSeverity.HIGH
              : signal.severity >= 20
                ? RiskSeverity.MEDIUM
                : RiskSeverity.LOW,
          score: signal.severity,
          reason: signal.reason,
        },
      });

      signalsCreated += 1;
    }
  }

  return {
    worksChecked,
    signalsCreated,
  };
}