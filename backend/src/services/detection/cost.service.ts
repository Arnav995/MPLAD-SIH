import { Prisma, RiskSeverity, RiskSignalType } from "@prisma/client";

import { prisma } from "../../db/prisma.js";
import { detectCostAnomaly } from "./cost.detector.js";

export async function runCostDetection() {
  const works = await prisma.work.findMany({
    select: {
      id: true,
      sanctionAmount: true,
      actualAmount: true,
    },
  });

  let worksChecked = 0;
  let signalsCreated = 0;

  for (const work of works) {
    const signal = detectCostAnomaly(work);

    worksChecked += 1;

    await prisma.riskSignal.deleteMany({
      where: {
        workId: work.id,
        type: RiskSignalType.COST_ANOMALY,
      },
    });

    if (!signal) {
      continue;
    }

    await prisma.riskSignal.create({
      data: {
        workId: work.id,
        type: RiskSignalType.COST_ANOMALY,
        severity:
          signal.severity >= 30
            ? RiskSeverity.HIGH
            : signal.severity >= 20
              ? RiskSeverity.MEDIUM
              : RiskSeverity.LOW,
        score: signal.severity,
        reason: signal.reason,
        evidence: signal.evidence as Prisma.InputJsonValue,
      },
    });

    signalsCreated += 1;
  }

  return {
    worksChecked,
    signalsCreated,
  };
}