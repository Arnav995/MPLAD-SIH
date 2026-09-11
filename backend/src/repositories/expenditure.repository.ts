import { prisma } from "../db/prisma.js";

export async function findWorkByRecommendationDtlId(
  recommendationDtlId: bigint,
) {
  return prisma.work.findUnique({
    where: {
      recommendationDtlId,
    },
    select: {
      id: true,
    },
  });
}

export async function upsertVendor(
  esakshiId: number,
  name: string,
) {
  return prisma.vendor.upsert({
    where: {
      esakshiId,
    },
    create: {
      esakshiId,
      name,
    },
    update: {
      name,
    },
  });
}

export async function upsertImplementingAgency(
  name: string,
) {
  return prisma.implementingAgency.upsert({
    where: {
      name,
    },
    create: {
      name,
    },
    update: {},
  });
}

export async function createExpenditure(data: {
  workId: number;
  vendorId?: number;
  implementingAgencyId?: number;
  amount: unknown;
  expenditureDate: Date | null;
  workStatus: string | null;
  workRecommendationDtlId: bigint;
  activityName: string | null;
  vendorNameFromSource: string | null;
  iaNameFromSource: string | null;
  constituencyFromSource: string | null;
  mpNameFromSource: string | null;
}) {
  return prisma.expenditure.create({
    data: {
      workId: data.workId,
      vendorId: data.vendorId ?? null,
      implementingAgencyId:
        data.implementingAgencyId ?? null,
      amount: data.amount as any,
      expenditureDate:
        data.expenditureDate,
      workStatus:
        data.workStatus,
      workRecommendationDtlId:
        data.workRecommendationDtlId,
      activityName:
        data.activityName,
      vendorNameFromSource:
        data.vendorNameFromSource,
      iaNameFromSource:
        data.iaNameFromSource,
      constituencyFromSource:
        data.constituencyFromSource,
      mpNameFromSource:
        data.mpNameFromSource,
    },
  });
}
export async function deleteExpendituresForRecommendations(
  recommendationDtlIds: bigint[],
) {
  if (recommendationDtlIds.length === 0) {
    return;
  }

  await prisma.expenditure.deleteMany({
    where: {
      workRecommendationDtlId: {
        in: recommendationDtlIds,
      },
    },
  });
}