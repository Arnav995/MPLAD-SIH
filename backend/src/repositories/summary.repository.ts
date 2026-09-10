import {
  WorkLifecycleStatus,
  RiskTier,
} from "@prisma/client";

import { prisma } from "../db/prisma.js";

export async function getSummaryData() {
  const [
    totalProjects,
    completedProjects,
    inProgressProjects,
    recommendedProjects,
    projectsWithRisk,
    cleanProjects,
    tier1Projects,
    tier2Projects,
  ] = await Promise.all([
    prisma.work.count(),

    prisma.work.count({
      where: {
        lifecycleStatus:
          WorkLifecycleStatus.COMPLETED,
      },
    }),

    prisma.work.count({
      where: {
        lifecycleStatus:
          WorkLifecycleStatus.IN_PROGRESS,
      },
    }),

    prisma.work.count({
      where: {
        lifecycleStatus:
          WorkLifecycleStatus.RECOMMENDED,
      },
    }),

    prisma.riskAssessment.count(),

    prisma.riskAssessment.count({
      where: {
        tier: RiskTier.CLEAN,
      },
    }),

    prisma.riskAssessment.count({
      where: {
        tier: RiskTier.TIER_1,
      },
    }),

    prisma.riskAssessment.count({
      where: {
        tier: RiskTier.TIER_2,
      },
    }),
  ]);

  return {
    totalProjects,
    completedProjects,
    inProgressProjects,
    recommendedProjects,
    projectsWithRisk,
    tierCounts: {
      clean: cleanProjects,
      tier1: tier1Projects,
      tier2: tier2Projects,
    },
  };
}