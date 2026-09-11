import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { getProjects } from "../api/district";

const PAGE_SIZE = 10;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRows(response) {
  if (Array.isArray(response?.projects)) {
    return response.projects;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data?.projects)) {
    return response.data.projects;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  return [];
}

function getTotal(response, fallback = 0) {
  const value =
    response?.total ??
    response?.total_count ??
    response?.data?.total ??
    response?.data?.total_count;

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeTier(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
}

function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    return {};
  }

  const riskAssessment =
    project.riskAssessment ??
    project.risk_assessment ??
    {};

  const primaryAnchors =
    project.primary_anchors ??
    project.primaryAnchors ??
    riskAssessment.primary_anchors ??
    riskAssessment.primaryAnchors ??
    {};

  const reasons =
    project.reasons ??
    riskAssessment?.explanation?.reasons ??
    [];

  const riskSignals =
    project.riskSignals ??
    project.risk_signals ??
    [];

  return {
    ...project,

    id:
      project.id ??
      project.workId ??
      project.work_id ??
      null,

    workId:
      project.workId ??
      project.work_id ??
      null,

    recommendationDtlId:
      project.recommendationDtlId ??
      project.recommendation_dtl_id ??
      null,

    activityName:
      project.activityName ??
      project.activity_name ??
      "",

    description:
      project.description ??
      project.work_description ??
      project.workDescription ??
      "",

    category:
      project.category ??
      project.work_category ??
      "",

    state:
      project.stateNameFromSource ??
      project.state_name_from_source ??
      project.state ??
      "",

    district:
      project.districtNameFromSource ??
      project.district_name_from_source ??
      project.district ??
      project.idaNameFromSource ??
      project.ida_name_from_source ??
      "",

    constituency:
      project.constituencyNameFromSource ??
      project.constituency_name_from_source ??
      project.constituency ??
      "",

    mpName:
      project.mpNameFromSource ??
      project.mp_name_from_source ??
      project.mp_name ??
      "",

    sanctionAmount:
      project.sanctionAmount ??
      project.sanction_amount ??
      null,

    recommendedAmount:
      project.recommendedAmount ??
      project.recommended_amount ??
      null,

    actualAmount:
      project.actualAmount ??
      project.actual_amount ??
      null,

    recommendationDate:
      project.recommendationDate ??
      project.recommendation_date ??
      null,

    sanctionDate:
      project.sanctionDate ??
      project.sanction_date ??
      null,

    completionDate:
      project.completionDate ??
      project.completion_date ??
      null,

    riskIndex:
      project.risk_index ??
      project.riskIndex ??
      riskAssessment.risk_index ??
      riskAssessment.riskIndex ??
      0,

    tier:
      project.tier ??
      project.risk_tier ??
      project.riskTier ??
      riskAssessment.tier ??
      riskAssessment.risk_tier ??
      riskAssessment.riskTier ??
      "CLEAN",

    primaryAnchors,

    reasons: Array.isArray(reasons)
      ? reasons.filter(Boolean)
      : [],

    riskAssessment: {
      ...riskAssessment,

      riskIndex:
        project.risk_index ??
        project.riskIndex ??
        riskAssessment.risk_index ??
        riskAssessment.riskIndex ??
        0,

      tier:
        project.tier ??
        project.risk_tier ??
        project.riskTier ??
        riskAssessment.tier ??
        riskAssessment.risk_tier ??
        riskAssessment.riskTier ??
        "CLEAN",

      primaryAnchors,

      explanation: {
        ...(riskAssessment.explanation ?? {}),
        reasons: Array.isArray(reasons)
          ? reasons.filter(Boolean)
          : [],
      },
    },

    riskSignals: Array.isArray(riskSignals)
      ? riskSignals
      : [],
  };
}

function isTier2(project) {
  const candidates = [
    project?.tier,
    project?.risk_tier,
    project?.riskTier,
    project?.riskAssessment?.tier,
    project?.riskAssessment?.risk_tier,
    project?.riskAssessment?.riskTier,
  ];

  return candidates.some((value) => {
    const normalized = normalizeTier(value);

    return (
      normalized === "TIER_2" ||
      normalized === "TIER2" ||
      normalized === "2"
    );
  });
}

function getRiskIndex(project) {
  const value =
    project?.riskIndex ??
    project?.riskAssessment?.riskIndex ??
    0;

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function getRiskLabel(project) {
  const tier = normalizeTier(
    project?.tier ??
      project?.riskAssessment?.tier
  );

  if (
    tier === "TIER_2" ||
    tier === "TIER2" ||
    tier === "HIGH"
  ) {
    return "High";
  }

  if (
    tier === "TIER_1" ||
    tier === "TIER1" ||
    tier === "MEDIUM"
  ) {
    return "Medium";
  }

  return "Low";
}

function getRiskClasses(project) {
  const label = getRiskLabel(project);

  if (label === "High") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (label === "Medium") {
    return "bg-surface-container-low text-on-surface border-surface-container-high";
  }

  return "bg-surface-container-low text-on-surface-variant border-surface-container-high";
}

function getReasons(project) {
  if (Array.isArray(project?.reasons)) {
    return project.reasons.filter(Boolean);
  }

  const reasons =
    project?.riskAssessment?.explanation?.reasons;

  return Array.isArray(reasons)
    ? reasons.filter(Boolean)
    : [];
}

function getPrimaryReason(project) {
  const reasons = getReasons(project);

  if (reasons.length > 0) {
    return reasons[0];
  }

  const signals = Array.isArray(
    project?.riskSignals
  )
    ? project.riskSignals
    : [];

  if (signals.length > 0) {
    return (
      signals[0]?.reason ||
      "Risk signal detected"
    );
  }

  const anchors =
    project?.primaryAnchors ??
    project?.riskAssessment?.primaryAnchors ??
    {};

  const activeAnchor = Object.entries(
    anchors
  ).find(([, value]) => Number(value) > 0);

  if (activeAnchor) {
    return `${activeAnchor[0]} signal detected`;
  }

  return "Tier-2 risk assessment";
}

function getProjectName(project) {
  return (
    project?.activityName ||
    project?.description ||
    `Work ${
      project?.workId ??
      project?.id ??
      ""
    }`
  );
}

function getLocation(project) {
  const parts = [
    project?.state,
    project?.constituency,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return (
    project?.district ||
    "Location unavailable"
  );
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function MinistryTier2() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const [totalProjects, setTotalProjects] =
    useState(0);

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  /* ------------------------------------------------------------------------ */
  /* Load Tier-2 projects                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setError("");

      try {
        /*
         * IMPORTANT:
         *
         * The backend already supports:
         *
         *   risk_tier=TIER_2
         *
         * Do NOT fetch all projects and try to classify them
         * on the frontend.
         */
        const response = await getProjects({
          page,
          page_size: PAGE_SIZE,
          sort: "risk_desc",
          risk_tier: "TIER_2",
        });

        if (cancelled) {
          return;
        }

        const rawRows = getRows(response);

        const normalizedRows =
          rawRows.map(normalizeProject);

        /*
         * Defensive validation.
         *
         * The backend should already return only TIER_2,
         * but this prevents accidental display of other tiers
         * if the API contract changes later.
         */
        const tier2Rows =
          normalizedRows.filter(isTier2);

        console.log(
          "[MPLADS Sentinel] /api/projects Tier-2 response:",
          response
        );

        console.log(
          "[MPLADS Sentinel] raw Tier-2 rows:",
          rawRows.length
        );

        console.log(
          "[MPLADS Sentinel] validated Tier-2 rows:",
          tier2Rows.length
        );

        if (normalizedRows.length > 0) {
          console.log(
            "[MPLADS Sentinel] first raw/normalized project:",
            normalizedRows[0]
          );

          console.log(
            "[MPLADS Sentinel] first project tier:",
            normalizedRows[0]?.tier,
            normalizedRows[0]?.riskAssessment?.tier
          );

          console.log(
            "[MPLADS Sentinel] first project risk index:",
            normalizedRows[0]?.riskIndex
          );
        }

        setProjects(tier2Rows);

        const backendTotal =
          getTotal(
            response,
            tier2Rows.length
          );

        setTotalProjects(
          backendTotal
        );
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          "[MPLADS Sentinel] Tier-2 load failed:",
          requestError
        );

        setProjects([]);
        setTotalProjects(0);

        setError(
          requestError?.message ||
            "Unable to load Tier-2 projects."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  /* ------------------------------------------------------------------------ */
  /* Local search                                                             */
  /* ------------------------------------------------------------------------ */

  const filteredProjects = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter(
      (project) => {
        const haystack = [
          project?.activityName,
          project?.description,
          project?.workId,
          project?.recommendationDtlId,
          project?.category,
          project?.state,
          project?.district,
          project?.constituency,
          project?.mpName,
          ...getReasons(project),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      }
    );
  }, [projects, search]);

  /* ------------------------------------------------------------------------ */
  /* KPIs                                                                     */
  /* ------------------------------------------------------------------------ */

  /*
   * Under the current composite risk model,
   * TIER_2 is the highest review tier.
   */
  const highRiskCount =
    totalProjects;

  const mediumRiskCount = 0;

  const lowRiskCount = 0;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalProjects / PAGE_SIZE
    )
  );

  const firstRecord =
    totalProjects === 0
      ? 0
      : (page - 1) *
          PAGE_SIZE +
        1;

  const lastRecord =
    totalProjects === 0
      ? 0
      : Math.min(
          page * PAGE_SIZE,
          totalProjects
        );

  /* ------------------------------------------------------------------------ */
  /* Markup                                                                   */
  /* ------------------------------------------------------------------------ */

  const markup = `
    <div class="min-h-screen bg-background text-on-surface">

      <!-- Sidebar -->
      <aside
        class="fixed top-0 bottom-0 left-0 w-64 bg-surface-container-lowest border-r border-surface-container-high flex flex-col justify-between p-4 z-30"
      >

        <div>

          <div class="px-2 pb-5 border-b border-surface-container-high">

            <div class="flex items-center gap-2.5">

              <div
                class="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm"
              >
                MS
              </div>

              <div>

                <div class="text-headline-sm font-bold tracking-tight">
                  MPLADS Sentinel
                </div>

                <div class="text-label-sm text-on-surface-variant">
                  Ministry Oversight
                </div>

              </div>

            </div>

          </div>

          <div class="mt-6">

            <div class="px-2 mb-2 text-label-sm uppercase tracking-wider text-outline font-semibold">
              Navigation
            </div>

            <nav class="space-y-1">

              <a
                href="#"
                data-path="/ministry/overview"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-sm font-medium"
              >
                <span class="material-symbols-outlined text-[19px]">
                  dashboard
                </span>
                National Overview
              </a>

              <a
                href="#"
                data-path="/ministry/tier-2"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
              >
                <span class="material-symbols-outlined text-[19px]">
                  fact_check
                </span>
                Tier-2 Digest
              </a>

              <a
                href="#"
                data-path="/ministry/benford"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-sm font-medium"
              >
                <span class="material-symbols-outlined text-[19px]">
                  analytics
                </span>
                Benford's Law
              </a>

            </nav>

          </div>

          <div class="mt-6 pt-5 border-t border-surface-container-high">

            <div class="px-2 mb-2 text-label-sm uppercase tracking-wider text-outline font-semibold">
              Governance
            </div>

            <nav>

              <a
                href="#"
                data-path="/district/audit-logs"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-sm font-medium"
              >
                <span class="material-symbols-outlined text-[19px]">
                  history
                </span>
                Audit Logs
              </a>

            </nav>

          </div>

        </div>

        <div class="p-3 bg-surface-container-low border border-surface-container-high rounded-lg">

          <div class="flex items-center gap-2">

            <span class="w-2 h-2 rounded-full bg-secondary"></span>

            <span class="text-label-md font-semibold">
              Ministry Oversight
            </span>

          </div>

        </div>

      </aside>

      <!-- Header -->
      <header
        class="ml-64 h-14 bg-surface-container-lowest border-b border-surface-container-high px-6 flex items-center justify-between sticky top-0 z-20"
      >

        <div class="relative w-96">

          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>

          <input
            id="tier2-search"
            type="search"
            placeholder="Search Tier-2 projects..."
            class="w-full h-9 pl-9 pr-3 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />

        </div>

        <div class="flex items-center gap-3">

          <div class="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-full">

            <span class="w-2 h-2 rounded-full bg-secondary"></span>

            <span class="text-label-md font-medium">
              Ministry Oversight
            </span>

          </div>

          <span class="material-symbols-outlined text-on-surface-variant">
            notifications
          </span>

        </div>

      </header>

      <!-- Main -->
      <main class="ml-64 p-8 max-w-[1500px]">

        <div class="max-w-[1360px] mx-auto space-y-7">

          <!-- Page heading -->
          <section class="border-b border-surface-container-high pb-5">

            <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">

              <div>

                <div class="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">

                  <span>MPLADS</span>
                  <span>/</span>
                  <span>Ministry Oversight</span>
                  <span>/</span>

                  <span class="font-semibold text-on-surface">
                    Tier-2 Digest
                  </span>

                </div>

                <h1 class="text-display-lg font-bold tracking-tight">
                  Tier-2 Digest
                </h1>

                <p class="text-body-md text-on-surface-variant mt-1">
                  Current Tier-2 projects returned by the live composite risk assessment.
                </p>

              </div>

              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-container-high bg-surface-container-lowest">

                <span class="w-2 h-2 rounded-full bg-secondary"></span>

                <span class="text-label-sm font-medium text-on-surface-variant">
                  Live backend data
                </span>

              </div>

            </div>

            <div class="mt-4 p-3 bg-surface-container-lowest border border-surface-container-high rounded-lg flex items-start gap-2.5">

              <span class="material-symbols-outlined text-on-surface-variant text-[18px]">
                info
              </span>

              <div class="text-body-sm text-on-surface-variant">

                <span class="font-medium text-on-surface">
                  Tier-2 is a review priority, not a finding of wrongdoing.
                </span>

                Review the underlying project evidence before taking administrative action.

              </div>

            </div>

          </section>

          ${
            loading
              ? `
                <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-12 text-center">

                  <div class="text-body-md font-semibold">
                    Loading Tier-2 projects…
                  </div>

                  <div class="text-body-sm text-on-surface-variant mt-1">
                    Querying the live TIER_2 project filter.
                  </div>

                </section>
              `
              : error
                ? `
                  <section class="bg-surface-container-lowest border border-red-200 rounded-xl p-8">

                    <div class="flex items-start gap-3">

                      <span class="material-symbols-outlined text-error">
                        error
                      </span>

                      <div>

                        <div class="text-body-md font-semibold text-error">
                          Unable to load Tier-2 projects
                        </div>

                        <div class="text-body-sm text-on-surface-variant mt-1">
                          ${escapeHtml(error)}
                        </div>

                        <button
                          id="tier2-error-refresh"
                          type="button"
                          class="mt-4 px-4 py-2 border border-outline-variant rounded-lg text-label-md font-semibold hover:bg-surface-container-low"
                        >
                          Retry
                        </button>

                      </div>

                    </div>

                  </section>
                `
                : `

                  <!-- KPI row -->
                  <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden">

                    <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-surface-container-high">

                      <div class="p-5">

                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          Tier-2 projects
                        </div>

                        <div class="text-3xl font-bold tabular-nums mt-2">
                          ${totalProjects.toLocaleString("en-IN")}
                        </div>

                      </div>

                      <div class="p-5">

                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          High risk
                        </div>

                        <div class="text-3xl font-bold tabular-nums text-error mt-2">
                          ${highRiskCount.toLocaleString("en-IN")}
                        </div>

                      </div>

                      <div class="p-5">

                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          Medium risk
                        </div>

                        <div class="text-3xl font-bold tabular-nums mt-2">
                          ${mediumRiskCount.toLocaleString("en-IN")}
                        </div>

                      </div>

                      <div class="p-5">

                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          Low risk
                        </div>

                        <div class="text-3xl font-bold tabular-nums mt-2">
                          ${lowRiskCount.toLocaleString("en-IN")}
                        </div>

                      </div>

                    </div>

                  </section>

                  <!-- Review queue -->
                  <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden">

                    <div class="px-5 py-5 border-b border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                      <div>

                        <h2 class="text-headline-md font-semibold">
                          Review queue
                        </h2>

                        <p class="text-body-sm text-on-surface-variant mt-1">
                          Projects currently classified as TIER_2 by the live composite risk assessment.
                        </p>

                      </div>

                      <div class="flex items-center gap-2">

                        <div class="relative w-64">

                          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                            search
                          </span>

                          <input
                            id="tier2-table-search"
                            type="search"
                            placeholder="Search projects..."
                            class="w-full h-9 pl-9 pr-3 bg-surface border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-primary"
                          />

                        </div>

                        <button
                          id="tier2-refresh"
                          type="button"
                          class="h-9 px-3 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container-low flex items-center gap-1.5"
                        >

                          <span class="material-symbols-outlined text-[17px]">
                            refresh
                          </span>

                          Refresh

                        </button>

                      </div>

                    </div>

                    ${
                      filteredProjects.length === 0
                        ? `
                          <div class="p-12 text-center">

                            <span class="material-symbols-outlined text-4xl text-outline">
                              inbox
                            </span>

                            <div class="text-body-md font-semibold mt-3">
                              No Tier-2 projects found
                            </div>

                            <div class="text-body-sm text-on-surface-variant mt-1">
                              ${
                                search
                                  ? "No loaded Tier-2 project matches the current search."
                                  : "The backend returned no TIER_2 projects."
                              }
                            </div>

                          </div>
                        `
                        : `

                          <div class="overflow-x-auto">

                            <table class="w-full border-collapse text-left">

                              <thead>

                                <tr class="bg-surface-container-low border-b border-surface-container-high">

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant">
                                    Project
                                  </th>

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant">
                                    Location
                                  </th>

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant">
                                    Category
                                  </th>

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant">
                                    Risk
                                  </th>

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant">
                                    Why Flagged
                                  </th>

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant text-right">
                                    Sanction
                                  </th>

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant text-right">
                                    Action
                                  </th>

                                </tr>

                              </thead>

                              <tbody class="divide-y divide-surface-container-high">

                                ${filteredProjects
                                  .map(
                                    (project) => `
                                      <tr class="hover:bg-surface-container-low transition-colors">

                                        <td class="py-4 px-5 align-top">

                                          <div class="font-medium leading-snug max-w-[340px]">
                                            ${escapeHtml(
                                              getProjectName(
                                                project
                                              )
                                            )}
                                          </div>

                                          <div class="text-label-sm text-on-surface-variant font-mono mt-1">

                                            ${
                                              project?.workId
                                                ? `Work ID: ${escapeHtml(
                                                    project.workId
                                                  )}`
                                                : `Project ID: ${escapeHtml(
                                                    project?.id ??
                                                      "—"
                                                  )}`
                                            }

                                          </div>

                                        </td>

                                        <td class="py-4 px-5 align-top">

                                          <div class="text-body-sm">
                                            ${escapeHtml(
                                              getLocation(
                                                project
                                              )
                                            )}
                                          </div>

                                          ${
                                            project?.mpName
                                              ? `
                                                <div class="text-label-sm text-on-surface-variant mt-1">
                                                  ${escapeHtml(
                                                    project.mpName
                                                  )}
                                                </div>
                                              `
                                              : ""
                                          }

                                        </td>

                                        <td class="py-4 px-5 align-top text-body-sm text-on-surface-variant">

                                          ${escapeHtml(
                                            project?.category ||
                                              "—"
                                          )}

                                        </td>

                                        <td class="py-4 px-5 align-top">

                                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-label-sm font-semibold ${getRiskClasses(
                                            project
                                          )}">

                                            <span class="w-1.5 h-1.5 rounded-full bg-current"></span>

                                            ${escapeHtml(
                                              getRiskLabel(
                                                project
                                              )
                                            )}

                                          </span>

                                          <div class="text-label-sm text-on-surface-variant mt-1 tabular-nums">
                                            Index ${escapeHtml(
                                              getRiskIndex(
                                                project
                                              )
                                            )}
                                          </div>

                                        </td>

                                        <td class="py-4 px-5 align-top">

                                          <div class="text-body-sm leading-relaxed max-w-[420px]">

                                            ${escapeHtml(
                                              getPrimaryReason(
                                                project
                                              )
                                            )}

                                          </div>

                                        </td>

                                        <td class="py-4 px-5 align-top text-right whitespace-nowrap">

                                          <div class="font-semibold text-body-sm tabular-nums">

                                            ${escapeHtml(
                                              formatCurrency(
                                                project?.sanctionAmount
                                              )
                                            )}

                                          </div>

                                          ${
                                            project?.sanctionDate
                                              ? `
                                                <div class="text-label-sm text-on-surface-variant mt-1">
                                                  ${escapeHtml(
                                                    formatDate(
                                                      project.sanctionDate
                                                    )
                                                  )}
                                                </div>
                                              `
                                              : ""
                                          }

                                        </td>

                                        <td class="py-4 px-5 align-top text-right">

                                          <a
                                            href="#"
                                            class="tier2-view text-primary font-semibold text-label-md hover:underline whitespace-nowrap"
                                            data-project-id="${escapeHtml(
                                              project?.id ??
                                                project?.workId ??
                                                ""
                                            )}"
                                          >
                                            View →
                                          </a>

                                        </td>

                                      </tr>
                                    `
                                  )
                                  .join("")}

                              </tbody>

                            </table>

                          </div>

                          <div class="px-5 py-4 border-t border-surface-container-high bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3">

                            <span class="text-label-sm text-on-surface-variant">

                              Showing
                              ${firstRecord.toLocaleString("en-IN")}
                              –
                              ${lastRecord.toLocaleString("en-IN")}
                              of
                              ${totalProjects.toLocaleString("en-IN")}
                              Tier-2 projects

                            </span>

                            <div class="flex items-center gap-2">

                              <button
                                id="tier2-prev"
                                type="button"
                                ${
                                  page <= 1
                                    ? "disabled"
                                    : ""
                                }
                                class="px-3 py-1.5 border border-outline-variant rounded-lg text-label-sm ${
                                  page <= 1
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-surface-container-low"
                                }"
                              >
                                Previous
                              </button>

                              <span class="px-2 text-label-sm font-semibold">
                                Page ${page} of ${totalPages}
                              </span>

                              <button
                                id="tier2-next"
                                type="button"
                                ${
                                  page >=
                                  totalPages
                                    ? "disabled"
                                    : ""
                                }
                                class="px-3 py-1.5 border border-outline-variant rounded-lg text-label-sm ${
                                  page >=
                                  totalPages
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-surface-container-low"
                                }"
                              >
                                Next
                              </button>

                            </div>

                          </div>

                        `
                    }

                  </section>

                `
          }

          <!-- Review guidance -->
          <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">

            <div class="flex items-start gap-3">

              <span class="material-symbols-outlined text-on-surface-variant">
                verified_user
              </span>

              <div>

                <h3 class="text-body-sm font-semibold">
                  Review guidance
                </h3>

                <p class="text-label-md text-on-surface-variant mt-1 leading-relaxed">
                  Tier-2 identifies projects requiring higher-priority review under the current composite risk assessment. It is not, by itself, evidence of fraud or misconduct. Inspect the project's underlying signals and evidence before taking action.
                </p>

              </div>

            </div>

          </section>

          <footer class="pt-5 pb-8 border-t border-surface-container-high text-label-sm text-on-surface-variant">

            National Informatics Centre · Ministry of Statistics and Programme Implementation

          </footer>

        </div>

      </main>

    </div>
  `;

  /* ------------------------------------------------------------------------ */
  /* DOM event wiring                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const headerSearch =
      document.getElementById(
        "tier2-search"
      );

    const tableSearch =
      document.getElementById(
        "tier2-table-search"
      );

    const refreshButton =
      document.getElementById(
        "tier2-refresh"
      );

    const errorRefreshButton =
      document.getElementById(
        "tier2-error-refresh"
      );

    const previousButton =
      document.getElementById(
        "tier2-prev"
      );

    const nextButton =
      document.getElementById(
        "tier2-next"
      );

    const navLinks =
      document.querySelectorAll(
        "[data-path]"
      );

    const projectLinks =
      document.querySelectorAll(
        ".tier2-view"
      );

    function updateSearch(event) {
      const value =
        event.target.value ?? "";

      if (
        headerSearch &&
        headerSearch !== event.target
      ) {
        headerSearch.value = value;
      }

      if (
        tableSearch &&
        tableSearch !== event.target
      ) {
        tableSearch.value = value;
      }

      setSearch(value);
    }

    function refresh() {
      setRefreshKey(
        (current) => current + 1
      );
    }

    function previousPage() {
      setPage(
        (current) =>
          Math.max(
            1,
            current - 1
          )
      );
    }

    function nextPage() {
      setPage(
        (current) =>
          Math.min(
            totalPages,
            current + 1
          )
      );
    }

    function handleNavigation(
      event
    ) {
      event.preventDefault();

      const path =
        event.currentTarget?.dataset
          ?.path;

      if (path) {
        navigate(path);
      }
    }

    function openProject(event) {
      event.preventDefault();

      const projectId =
        event.currentTarget?.dataset
          ?.projectId;

      if (!projectId) {
        return;
      }

      navigate(
        `/district/projects/${encodeURIComponent(
          projectId
        )}`
      );
    }

    headerSearch?.addEventListener(
      "input",
      updateSearch
    );

    tableSearch?.addEventListener(
      "input",
      updateSearch
    );

    refreshButton?.addEventListener(
      "click",
      refresh
    );

    errorRefreshButton?.addEventListener(
      "click",
      refresh
    );

    previousButton?.addEventListener(
      "click",
      previousPage
    );

    nextButton?.addEventListener(
      "click",
      nextPage
    );

    navLinks.forEach((link) => {
      link.addEventListener(
        "click",
        handleNavigation
      );
    });

    projectLinks.forEach((link) => {
      link.addEventListener(
        "click",
        openProject
      );
    });

    return () => {
      headerSearch?.removeEventListener(
        "input",
        updateSearch
      );

      tableSearch?.removeEventListener(
        "input",
        updateSearch
      );

      refreshButton?.removeEventListener(
        "click",
        refresh
      );

      errorRefreshButton?.removeEventListener(
        "click",
        refresh
      );

      previousButton?.removeEventListener(
        "click",
        previousPage
      );

      nextButton?.removeEventListener(
        "click",
        nextPage
      );

      navLinks.forEach((link) => {
        link.removeEventListener(
          "click",
          handleNavigation
        );
      });

      projectLinks.forEach((link) => {
        link.removeEventListener(
          "click",
          openProject
        );
      });
    };
  }, [
    navigate,
    totalPages,
  ]);

  return (
    <div
      className="stitch-page-root"
      dangerouslySetInnerHTML={{
        __html: markup,
      }}
    />
  );
}

/*

*/
