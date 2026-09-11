import type { Work } from "@prisma/client";

type ProjectWithRelations = Work & {
  district: { name: string } | null;
  mp: { name: string } | null;
  constituency: { name: string } | null;
  riskAssessment: {
    riskIndex: unknown;
    tier: string;
    primaryAnchors: unknown;
  } | null;
  riskSignals: Array<{
    type: string;
  }>;
};

export function toProjectListItem(project: ProjectWithRelations) {
  const primaryAnchors =
    project.riskAssessment?.primaryAnchors ?? {
      costScore: 0,
      duplicateScore: 0,
      consistencyScore: 0,
    };

  const signalTypes = new Set(
    project.riskSignals.map((signal) => signal.type),
  );

  return {
    work_id: project.id,
    activity_name: project.activityName,
    constituency:
      project.constituency?.name ??
      project.constituencyNameFromSource,
    district:
      project.district?.name ??
      null,
    mp_name:
      project.mp?.name ??
      project.mpNameFromSource,
    work_category: project.category,
    sanction_amount: project.sanctionAmount?.toString() ?? null,
    days_to_sanction: calculateDaysToSanction(
      project.recommendationDate,
      project.sanctionDate,
    ),
    is_completed:
      project.lifecycleStatus === "COMPLETED",
    risk_index:
      project.riskAssessment?.riskIndex?.toString() ?? "0",
    tier:
      project.riskAssessment?.tier ?? "CLEAN",
    primary_anchors: primaryAnchors,
    signal_type_count: signalTypes.size,
  };
}

function calculateDaysToSanction(
  recommendationDate: Date | null,
  sanctionDate: Date | null,
): number | null {
  if (!recommendationDate || !sanctionDate) {
    return null;
  }

  const diff =
    sanctionDate.getTime() -
    recommendationDate.getTime();

  return Math.floor(
    diff / (1000 * 60 * 60 * 24),
  );
}