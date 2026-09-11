import {
  Prisma,
  WorkLifecycleStatus,
  RiskTier,
} from "@prisma/client";

import { prisma } from "../db/prisma.js";

export interface ProjectListFilters {
  district?: string;
  mp?: string;
  lifecycleStatus?: WorkLifecycleStatus;
  riskTier?: RiskTier;
  minRiskIndex?: number;
  category?: string;
  page: number;
  pageSize: number;
  sort?: string;
}

export async function findProjects(
  filters: ProjectListFilters,
) {
  const where: Prisma.WorkWhereInput = {};

  if (filters.lifecycleStatus) {
    where.lifecycleStatus =
      filters.lifecycleStatus;
  }

  if (filters.category) {
    where.category = {
      contains: filters.category,
      mode: "insensitive",
    };
  }

  if (filters.district) {
  where.district = {
    name: {
      contains: filters.district,
      mode: "insensitive",
    },
  };
}

if (filters.mp) {
  where.mpNameFromSource = {
    contains: filters.mp,
    mode: "insensitive",
  };
}
  if (
    filters.riskTier ||
    filters.minRiskIndex !== undefined
  ) {
    where.riskAssessment = {};

    if (filters.riskTier) {
      where.riskAssessment.tier =
        filters.riskTier;
    }

    if (
      filters.minRiskIndex !== undefined
    ) {
      where.riskAssessment.riskIndex = {
        gte: new Prisma.Decimal(
          filters.minRiskIndex,
        ),
      };
    }
  }

  const orderBy =
    getOrderBy(filters.sort);

  const skip =
    (filters.page - 1) *
    filters.pageSize;

  const [projects, total] =
    await Promise.all([
      prisma.work.findMany({
        where,

        skip,

        take: filters.pageSize,

        orderBy,

        include: {
          district: true,
          mp: true,
          constituency: true,

          riskAssessment: true,

          riskSignals: {
            orderBy: {
              detectedAt: "desc",
            },

            take: 5,
          },
        },
      }),

      prisma.work.count({
        where,
      }),
    ]);

  return {
    projects,
    total,
  };
}

function getOrderBy(
  sort?: string,
): Prisma.WorkOrderByWithRelationInput {
  switch (sort) {
    case "risk_asc":
      return {
        riskAssessment: {
          riskIndex: "asc",
        },
      };

    case "risk_desc":
      return {
        riskAssessment: {
          riskIndex: "desc",
        },
      };

    case "amount_asc":
      return {
        sanctionAmount: "asc",
      };

    case "amount_desc":
      return {
        sanctionAmount: "desc",
      };

    case "newest":
      return {
        createdAt: "desc",
      };

    case "oldest":
      return {
        createdAt: "asc",
      };

    default:
      return {
        updatedAt: "desc",
      };
  }
}

export async function findProjectById(
  workId: number,
) {
  return prisma.work.findUnique({
    where: {
      id: workId,
    },

    include: {
      state: true,
      district: true,
      constituency: true,
      mp: true,
      implementingAgency: true,

      expenditures: {
        orderBy: {
          expenditureDate: "desc",
        },
      },

      reviews: {
        orderBy: {
          createdAt: "desc",
        },
      },

      riskAssessment: true,

      riskSignals: {
        orderBy: {
          detectedAt: "desc",
        },
      },

      duplicateCandidatesA: {
        include: {
          workB: true,
        },
      },

      duplicateCandidatesB: {
        include: {
          workA: true,
        },
      },
    },
  });
}