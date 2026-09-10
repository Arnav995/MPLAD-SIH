import {
  getSummaryData,
} from "../repositories/summary.repository.js";

export async function getSummary() {
  const summary =
    await getSummaryData();

  return {
    total_projects:
      summary.totalProjects,

    completed_projects:
      summary.completedProjects,

    in_progress_projects:
      summary.inProgressProjects,

    recommended_projects:
      summary.recommendedProjects,

    projects_with_risk_assessment:
      summary.projectsWithRisk,

    tier_counts:
      summary.tierCounts,
  };
}