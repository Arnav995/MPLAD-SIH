import { Prisma, WorkLifecycleStatus } from "@prisma/client";

import { prisma } from "../db/prisma.js";

export interface UpsertRecommendedWorkInput {
  recommendationDtlId: bigint;

  activityName: string | null;
  category: string | null;
  description: string | null;

  stateNameFromSource: string | null;
  constituencyNameFromSource: string | null;
  mpNameFromSource: string | null;
  idaNameFromSource: string | null;

  lifecycleStatus: WorkLifecycleStatus;

  recommendationDate: Date | null;
  sanctionDate: Date | null;

  recommendedAmount: Prisma.Decimal | null;
  sanctionAmount: Prisma.Decimal | null;

  letterNo: string | null;
  flag: number | null;
}

export async function upsertRecommendedWork(
  input: UpsertRecommendedWorkInput,
) {
  return prisma.work.upsert({
    where: {
      recommendationDtlId: input.recommendationDtlId,
    },

    create: {
      recommendationDtlId: input.recommendationDtlId,

      activityName: input.activityName,
      category: input.category,
      description: input.description,

      stateNameFromSource: input.stateNameFromSource,
      constituencyNameFromSource:
        input.constituencyNameFromSource,
      mpNameFromSource: input.mpNameFromSource,
      idaNameFromSource: input.idaNameFromSource,

      lifecycleStatus: input.lifecycleStatus,

      recommendationDate: input.recommendationDate,
      sanctionDate: input.sanctionDate,

      recommendedAmount: input.recommendedAmount,
      sanctionAmount: input.sanctionAmount,

      letterNo: input.letterNo,
      flag: input.flag,
    },

    update: {
      activityName: input.activityName,
      category: input.category,
      description: input.description,

      stateNameFromSource: input.stateNameFromSource,
      constituencyNameFromSource:
        input.constituencyNameFromSource,
      mpNameFromSource: input.mpNameFromSource,
      idaNameFromSource: input.idaNameFromSource,

      lifecycleStatus: input.lifecycleStatus,

      recommendationDate: input.recommendationDate,
      sanctionDate: input.sanctionDate,

      recommendedAmount: input.recommendedAmount,
      sanctionAmount: input.sanctionAmount,

      letterNo: input.letterNo,
      flag: input.flag,
    },
  });
}export async function updateCompletedWork(
  input: {
    recommendationDtlId: bigint;
    workId: bigint | null;
    activityName: string | null;
    actualAmount: Prisma.Decimal | null;
    completionDate: Date | null;
    stateNameFromSource: string | null;
    constituencyNameFromSource: string | null;
    mpNameFromSource: string | null;
    idaNameFromSource: string | null;
    averageRating: Prisma.Decimal | null;
    lifecycleStatus: WorkLifecycleStatus;
  },
) {
  return prisma.work.update({
    where: {
      recommendationDtlId: input.recommendationDtlId,
    },
    data: {
      workId: input.workId,
      activityName: input.activityName,
      actualAmount: input.actualAmount,
      completionDate: input.completionDate,
      stateNameFromSource: input.stateNameFromSource,
      constituencyNameFromSource:
        input.constituencyNameFromSource,
      mpNameFromSource: input.mpNameFromSource,
      idaNameFromSource: input.idaNameFromSource,
      averageRating: input.averageRating,
      lifecycleStatus: input.lifecycleStatus,
    },
  });
}