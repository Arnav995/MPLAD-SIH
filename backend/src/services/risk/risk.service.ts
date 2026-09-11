import { Prisma, RiskTier, RiskSignalType } from "@prisma/client";

import { prisma } from "../../db/prisma.js";

export async function runRiskAssessment() {
  const works = await prisma.work.findMany({
    select: {
      id: true,
      riskSignals: {
        select: {
          type: true,
          score: true,
          severity: true,
          reason: true,
        },
      },
    },
  });

  let worksEvaluated = 0;

  for (const work of works) {
    let costScore = 0;
    let duplicateScore = 0;
    let consistencyScore = 0;

    const reasons: string[] = [];

    for (const signal of work.riskSignals) {
      const score = Number(signal.score ?? 0);

      if (signal.type === RiskSignalType.COST_ANOMALY) {
        costScore = Math.max(costScore, score);
      }

      if (signal.type === RiskSignalType.DUPLICATE_OVERLAP) {
          duplicateScore = Math.min(35, Math.max(duplicateScore, score));
      }

      if (
        signal.type === RiskSignalType.CROSS_STAGE_CONSISTENCY
      ) {
        consistencyScore = Math.max(
          consistencyScore,
          score,
        );
      }

      if (signal.reason) {
        reasons.push(signal.reason);
      }
    }

    const riskIndex = Math.min(
      100,
      costScore + duplicateScore + consistencyScore,
    );

    const signalTypeCount = [
            costScore > 0,
            duplicateScore > 0,
            consistencyScore > 0,
          ].filter(Boolean).length;

    const tier =
      signalTypeCount >= 2 && riskIndex >= 70
        ? RiskTier.TIER_2
        : riskIndex >= 35
          ? RiskTier.TIER_1
          : RiskTier.CLEAN;

    await prisma.riskAssessment.upsert({
      where: {
        workId: work.id,
      },
      create: {
        workId: work.id,
        riskIndex: new Prisma.Decimal(riskIndex),
        tier,
        primaryAnchors: {
          costScore,
          duplicateScore,
          consistencyScore,
        },
        explanation: {
          reasons,
        },
      },
      update: {
        riskIndex: new Prisma.Decimal(riskIndex),
        tier,
        primaryAnchors: {
          costScore,
          duplicateScore,
          consistencyScore,
        },
        explanation: {
          reasons,
        },
        evaluatedAt: new Date(),
      },
    });

    worksEvaluated += 1;
  }

  return {
    worksEvaluated,
  };
}