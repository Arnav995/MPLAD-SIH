import { Prisma, RiskSeverity, RiskSignalType } from "@prisma/client";

import { prisma } from "../../db/prisma.js";

export async function createDuplicateRiskSignals() {
  const candidates = await prisma.duplicateCandidate.findMany({
    select: {
      workAId: true,
      workBId: true,
      suspicionScore: true,
      humanReviewReason: true,
    },
  });

  await prisma.riskSignal.deleteMany({
    where: {
      type: RiskSignalType.DUPLICATE_OVERLAP,
    },
  });

  let signalsCreated = 0;

  for (const candidate of candidates) {
    const score = Number(candidate.suspicionScore ?? 0);

    const severity =
      score >= 80
        ? RiskSeverity.HIGH
        : score >= 50
          ? RiskSeverity.MEDIUM
          : RiskSeverity.LOW;

    const evidence = {
      matchedWorkId: candidate.workBId,
      suspicionScore: score,
    };

    await prisma.riskSignal.create({
      data: {
        workId: candidate.workAId,
        type: RiskSignalType.DUPLICATE_OVERLAP,
        severity,
        score: new Prisma.Decimal(score),
        reason:
          candidate.humanReviewReason ??
          "Potential duplicate or overlapping work detected.",
        evidence: evidence as Prisma.InputJsonValue,
      },
    });

    signalsCreated += 1;
  }

  return {
    candidatesProcessed: candidates.length,
    signalsCreated,
  };
}