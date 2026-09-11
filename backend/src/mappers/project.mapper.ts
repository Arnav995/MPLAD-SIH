import type { Work } from "@prisma/client";

type ProjectWithRelations = Work & {
  district: { name: string } | null;

  mp: { name: string } | null;

  constituency: { name: string } | null;

  riskAssessment: {
    riskIndex: unknown;
    tier: string;
    primaryAnchors: unknown;
    explanation: unknown;
  } | null;

  riskSignals: Array<{
    type: string;
    severity: string;
    score: unknown;
    reason: string | null;
    evidence: unknown;
  }>;
};

export function toProjectListItem(
  project: ProjectWithRelations,
) {
  const primaryAnchors =
    project.riskAssessment?.primaryAnchors ?? {
      costScore: 0,
      duplicateScore: 0,
      consistencyScore: 0,
    };

  const signalTypes = new Set(
    project.riskSignals.map(
      (signal) => signal.type,
    ),
  );

  const riskSignals =
    project.riskSignals.map(
      (signal) => ({
        type: signal.type,
        severity: signal.severity,
        score:
          signal.score?.toString() ?? "0",
        reason: signal.reason,
        evidence:
          signal.evidence,
      }),
    );

  return {
    work_id: project.id,

    activity_name:
      project.activityName,

    constituency:
      project.constituency?.name ??
      project.constituencyNameFromSource,

    district:
      project.district?.name ??
      null,

    mp_name:
      project.mp?.name ??
      project.mpNameFromSource,

    work_category:
      project.category,

    sanction_amount:
      project.sanctionAmount?.toString() ??
      null,

    days_to_sanction:
      calculateDaysToSanction(
        project.recommendationDate,
        project.sanctionDate,
      ),

    is_completed:
      project.lifecycleStatus ===
      "COMPLETED",

    risk_index:
      project.riskAssessment?.riskIndex?.toString() ??
      "0",

    tier:
      project.riskAssessment?.tier ??
      "CLEAN",

    primary_anchors:
      primaryAnchors,

    signal_type_count:
      signalTypes.size,

    risk_signals:
      riskSignals,
  };
}

function calculateDaysToSanction(
  recommendationDate: Date | null,
  sanctionDate: Date | null,
): number | null {
  if (
    !recommendationDate ||
    !sanctionDate
  ) {
    return null;
  }

  const diff =
    sanctionDate.getTime() -
    recommendationDate.getTime();

  return Math.floor(
    diff /
      (1000 * 60 * 60 * 24),
  );
}