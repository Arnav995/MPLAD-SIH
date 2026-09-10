import { Prisma } from "@prisma/client";

import { prisma } from "../../db/prisma.js";
import { detectDuplicatePairs } from "./duplicate.detector.js";

export async function runDuplicateDetection() {
  const works = await prisma.work.findMany({
    select: {
      id: true,
      recommendationDtlId: true,
      activityName: true,
      description: true,
      constituencyNameFromSource: true,
    },
  });

  const pairs = detectDuplicatePairs(works);

  await prisma.duplicateCandidate.deleteMany({});

  let candidatesCreated = 0;

  for (const pair of pairs) {
    await prisma.duplicateCandidate.create({
      data: {
        workAId: pair.workId,
        workBId: pair.matchedWorkId,
        textSimilarity: new Prisma.Decimal(1),
        suspicionScore: new Prisma.Decimal(pair.score),
        humanReviewReason: pair.reason,
      },
    });

    candidatesCreated += 1;
  }

  return {
    worksChecked: works.length,
    candidatesCreated,
  };
}