import { prisma } from "../../db/prisma.js";
import {
  RiskSeverity,
  RiskSignalType,
} from "@prisma/client";

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
    },
  });

  let worksChecked = 0;
  let signalsCreated = 0;

  for (const work of works) {
    const signals = detectConsistencyIssues(work);

    worksChecked += 1;

    await prisma.riskSignal.deleteMany({
      where: {
        workId: work.id,
        type: RiskSignalType.CROSS_STAGE_CONSISTENCY,
      },
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