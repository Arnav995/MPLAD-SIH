import { prisma } from "../db/prisma.js";
import { RiskTier, WorkLifecycleStatus } from "@prisma/client";

export async function getSummaryData() {
  const [
    totalProjects,
    completedProjects,
    inProgressProjects,
    recommendedProjects,
    projectsWithRisk,
    tierCounts,
  ] = await Promise.all([
    prisma.work.count(),

    prisma.work.count({
      where: {
        lifecycleStatus: WorkLifecycleStatus.COMPLETED,
      },
    }),

    prisma.work.count({
      where: {
        lifecycleStatus: WorkLifecycleStatus.IN_PROGRESS,
      },
    }),

    prisma.work.count({
      where: {
        lifecycleStatus: WorkLifecycleStatus.RECOMMENDED,
      },
    }),

    prisma.riskAssessment.count(),

    prisma.riskAssessment.groupBy({
      by: ["tier"],
      _count: {
        id: true,
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
      clean:
        tierCounts.find((item) => item.tier === RiskTier.CLEAN)?._count.id ?? 0,

      tier1:
        tierCounts.find((item) => item.tier === RiskTier.TIER_1)?._count.id ?? 0,

      tier2:
        tierCounts.find((item) => item.tier === RiskTier.TIER_2)?._count.id ?? 0,
    },
  };
}

export async function getDistrictSummaries() {
  const works = await prisma.work.findMany({
    select: {
      district: {
        select: {
          id: true,
          name: true,
        },
      },
      districtId: true,
      lifecycleStatus: true,
      riskAssessment: {
        select: {
          riskIndex: true,
          tier: true,
        },
      },
    },
  });

  const summaries = new Map<
    string,
    {
      district_id: number;
      district: string;
      total_projects: number;
      completed_projects: number;
      in_progress_projects: number;
      recommended_projects: number;
      average_risk_index: number;
      tier1_count: number;
      tier2_count: number;
    }
  >();

  for (const work of works) {
    // Do not manufacture a district from state/IDA/source fields.
    if (!work.districtId || !work.district) {
      continue;
    }

    const key = String(work.districtId);

    let summary = summaries.get(key);

    if (!summary) {
      summary = {
        district_id: work.district.id,
        district: work.district.name,
        total_projects: 0,
        completed_projects: 0,
        in_progress_projects: 0,
        recommended_projects: 0,
        average_risk_index: 0,
        tier1_count: 0,
        tier2_count: 0,
      };

      summaries.set(key, summary);
    }

    summary.total_projects += 1;

    if (work.lifecycleStatus === WorkLifecycleStatus.COMPLETED) {
      summary.completed_projects += 1;
    }

    if (work.lifecycleStatus === WorkLifecycleStatus.IN_PROGRESS) {
      summary.in_progress_projects += 1;
    }

    if (work.lifecycleStatus === WorkLifecycleStatus.RECOMMENDED) {
      summary.recommended_projects += 1;
    }

    if (work.riskAssessment?.tier === RiskTier.TIER_1) {
      summary.tier1_count += 1;
    }

    if (work.riskAssessment?.tier === RiskTier.TIER_2) {
      summary.tier2_count += 1;
    }

    if (work.riskAssessment?.riskIndex != null) {
      summary.average_risk_index += Number(
        work.riskAssessment.riskIndex,
      );
    }
  }

  return Array.from(summaries.values()).map((summary) => ({
    ...summary,
    average_risk_index:
      summary.total_projects > 0
        ? Number(
            (
              summary.average_risk_index / summary.total_projects
            ).toFixed(2),
          )
        : 0,
  }));
}

export async function getMpSummaries() {
  const works = await prisma.work.findMany({
    select: {
      mp: {
        select: {
          id: true,
          name: true,
        },
      },
      mpId: true,
      mpNameFromSource: true,
      lifecycleStatus: true,
      riskAssessment: {
        select: {
          riskIndex: true,
          tier: true,
        },
      },
    },
  });

  const summaries = new Map<
    string,
    {
      mp_id: number | null;
      mp_name: string;
      total_projects: number;
      completed_projects: number;
      in_progress_projects: number;
      recommended_projects: number;
      average_risk_index: number;
      tier1_count: number;
      tier2_count: number;
    }
  >();

  for (const work of works) {
    const mpName = work.mp?.name ?? work.mpNameFromSource;

    if (!mpName) {
      continue;
    }

    const key = work.mpId
      ? `id:${work.mpId}`
      : `source:${mpName.toLowerCase()}`;

    let summary = summaries.get(key);

    if (!summary) {
      summary = {
        mp_id: work.mp?.id ?? null,
        mp_name: mpName,
        total_projects: 0,
        completed_projects: 0,
        in_progress_projects: 0,
        recommended_projects: 0,
        average_risk_index: 0,
        tier1_count: 0,
        tier2_count: 0,
      };

      summaries.set(key, summary);
    }

    summary.total_projects += 1;

    if (work.lifecycleStatus === WorkLifecycleStatus.COMPLETED) {
      summary.completed_projects += 1;
    }

    if (work.lifecycleStatus === WorkLifecycleStatus.IN_PROGRESS) {
      summary.in_progress_projects += 1;
    }

    if (work.lifecycleStatus === WorkLifecycleStatus.RECOMMENDED) {
      summary.recommended_projects += 1;
    }

    if (work.riskAssessment?.tier === RiskTier.TIER_1) {
      summary.tier1_count += 1;
    }

    if (work.riskAssessment?.tier === RiskTier.TIER_2) {
      summary.tier2_count += 1;
    }

    if (work.riskAssessment?.riskIndex != null) {
      summary.average_risk_index += Number(
        work.riskAssessment.riskIndex,
      );
    }
  }

  return Array.from(summaries.values()).map((summary) => ({
    ...summary,
    average_risk_index:
      summary.total_projects > 0
        ? Number(
            (
              summary.average_risk_index / summary.total_projects
            ).toFixed(2),
          )
        : 0,
  }));
}

export async function getSummary() {
  const summary = await getSummaryData();

  return {
    total_projects: summary.totalProjects,
    completed_projects: summary.completedProjects,
    in_progress_projects: summary.inProgressProjects,
    recommended_projects: summary.recommendedProjects,
    projects_with_risk_assessment: summary.projectsWithRisk,
    tier_counts: summary.tierCounts,
  };
}