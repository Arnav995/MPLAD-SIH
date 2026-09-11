import { request, queryString } from "./client";

function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    return {};
  }

  return {
    ...project,

    id:
      project.work_id ??
      project.id ??
      null,

    workId:
      project.work_id ??
      project.workId ??
      null,

    activityName:
      project.activity_name ??
      project.activityName ??
      "",

    category:
      project.work_category ??
      project.category ??
      "",

    sanctionAmount:
      project.sanction_amount ??
      project.sanctionAmount ??
      null,

    recommendedAmount:
      project.recommended_amount ??
      project.recommendedAmount ??
      null,

    actualAmount:
      project.actual_amount ??
      project.actualAmount ??
      null,

    stateNameFromSource:
      project.state ??
      project.state_name_from_source ??
      project.stateNameFromSource ??
      "",

    districtNameFromSource:
      project.district ??
      project.district_name_from_source ??
      project.districtNameFromSource ??
      "",

    constituencyNameFromSource:
      project.constituency ??
      project.constituency_name_from_source ??
      project.constituencyNameFromSource ??
      "",

    mpNameFromSource:
      project.mp_name ??
      project.mpNameFromSource ??
      "",

    riskAssessment: {
      riskIndex:
        project.risk_index ??
        project.riskIndex ??
        0,

      tier:
        project.tier ??
        project.risk_tier ??
        "CLEAN",

      primaryAnchors:
        project.primary_anchors ??
        project.primaryAnchors ??
        {},

      explanation:
        project.explanation ??
        project.risk_explanation ??
        null,
    },

    riskSignals:
      Array.isArray(project.risk_signals)
        ? project.risk_signals
        : Array.isArray(project.riskSignals)
          ? project.riskSignals
          : [],
  };
}

export const getProjects = (params = {}) =>
  request(`/projects${queryString(params)}`);

export const getProject = (projectId) =>
  request(`/projects/${projectId}`);

export const getDistrictOverview = async (params = {}) => {
  const response = await getProjects({
    page: 1,
    page_size: 10,
    sort: "risk_desc",
    ...params,
  });

  return {
    ...response,

    projects: Array.isArray(response?.projects)
      ? response.projects.map(normalizeProject)
      : [],
  };
};

export const getDuplicateCandidates = async (params = {}) => {
  const response = await request(
    `/duplicates${queryString(params)}`
  );

  const duplicates = Array.isArray(response?.duplicates)
    ? response.duplicates
    : [];

  return {
    results: duplicates.map((item) => {
      const suspicionScore = Number(
        item?.suspicion_score ?? 0
      );

      const textSimilarity = Number(
        item?.text_similarity ?? 0
      );

      const workA = item?.work_a ?? {};
      const workB = item?.work_b ?? {};

      return {
        candidate_id:
          item?.candidate_id ?? null,

        work_id_a:
          workA?.work_id != null
            ? String(workA.work_id)
            : "",

        work_id_b:
          workB?.work_id != null
            ? String(workB.work_id)
            : "",

        /*
         * The current duplicate API does not return a
         * district field. Keep the constituency available
         * in the candidate payload rather than inventing
         * a district value.
         */
        district:
          workA?.constituency ??
          workB?.constituency ??
          "",

        text_similarity: textSimilarity,

        /*
         * Backend duplicate suspicion score is currently
         * 0-100.
         *
         * The Duplicate Detection UI expects 0-1.
         */
        duplicate_suspicion_score:
          suspicionScore > 1
            ? suspicionScore / 100
            : suspicionScore,

        /*
         * These fields are not present in the current
         * /api/duplicates response.
         *
         * Do not fabricate evidence.
         */
        days_apart: null,
        same_vendor: null,
        amount_ratio: null,

        reason:
          `Potential duplicate: Work ${
            workA?.work_id ?? "A"
          } and Work ${
            workB?.work_id ?? "B"
          } have ${
            (textSimilarity * 100).toFixed(1)
          }% text similarity with a suspicion score of ${
            suspicionScore
          }.`,
      };
    }),
  };
};

export const getCostAnomalies = (params = {}) =>
  getProjects({
    page: 1,
    page_size: 50,
    min_risk_index: 25,
    sort: "risk_desc",
    ...params,
  });

export const getAuditLogs = async () => ({
  data: [],
  total: 0,
  unavailable: true,
});