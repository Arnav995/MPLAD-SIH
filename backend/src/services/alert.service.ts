import { RiskTier } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export async function getTier2Digest() {
  const projects = await prisma.work.findMany({
    where: {
      riskAssessment: {
        tier: RiskTier.TIER_2,
      },
    },
    orderBy: {
      riskAssessment: {
        riskIndex: "desc",
      },
    },
    include: {
      district: true,
      constituency: true,
      mp: true,
      riskAssessment: true,
      riskSignals: {
        orderBy: {
          detectedAt: "desc",
        },
      },
    },
  });

  return projects.map((project) => ({
    work_id: project.id,
    activity_name: project.activityName,
    constituency:
      project.constituency?.name ??
      project.constituencyNameFromSource,
    district:
      project.district?.name ?? null,
    mp_name:
      project.mp?.name ??
      project.mpNameFromSource,
    risk_index:
      project.riskAssessment?.riskIndex?.toString() ?? "0",
    tier:
      project.riskAssessment?.tier ?? "CLEAN",
    primary_anchors:
      project.riskAssessment?.primaryAnchors ?? {
        costScore: 0,
        duplicateScore: 0,
        consistencyScore: 0,
      },
    reasons:
      project.riskAssessment?.explanation ?? {
        reasons: [],
      },
    signal_type_count: new Set(
      project.riskSignals.map((signal) => signal.type),
    ).size,
    signals: project.riskSignals.map((signal) => ({
      type: signal.type,
      severity: signal.severity,
      score: signal.score?.toString() ?? "0",
      reason: signal.reason,
      evidence: signal.evidence,
    })),
  }));
}