import { prisma } from "../db/prisma.js";

export interface DuplicateListFilters {
  minScore?: number;
  page: number;
  pageSize: number;
}

export async function findDuplicates(
  filters: DuplicateListFilters,
) {
  const where =
    filters.minScore !== undefined
      ? {
          suspicionScore: {
            gte: filters.minScore,
          },
        }
      : {};

  const skip =
    (filters.page - 1) * filters.pageSize;

  const [duplicates, total] = await Promise.all([
    prisma.duplicateCandidate.findMany({
      where,
      skip,
      take: filters.pageSize,
      orderBy: {
        suspicionScore: "desc",
      },
      include: {
        workA: {
          select: {
            id: true,
            activityName: true,
            description: true,
            category: true,
            constituencyNameFromSource: true,
            mpNameFromSource: true,
            recommendedAmount: true,
            sanctionAmount: true,
          },
        },
        workB: {
          select: {
            id: true,
            activityName: true,
            description: true,
            category: true,
            constituencyNameFromSource: true,
            mpNameFromSource: true,
            recommendedAmount: true,
            sanctionAmount: true,
          },
        },
      },
    }),
    prisma.duplicateCandidate.count({
      where,
    }),
  ]);

  return {
    duplicates,
    total,
  };
}