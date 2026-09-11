import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getMinistryProjects,
  getMinistrySummary,
} from "../api/ministry";

const PAGE_SIZE = 6;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    return {};
  }

  const riskAssessment =
    project.riskAssessment ??
    project.risk_assessment ??
    {};

  const reasons =
    riskAssessment?.explanation?.reasons ??
    project.reasons ??
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
      project.id ??
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

    updatedAt:
      project.updatedAt ??
      project.updated_at ??
      project.createdAt ??
      project.created_at ??
      null,

    riskAssessment: {
      ...riskAssessment,

      riskIndex:
        riskAssessment.riskIndex ??
        riskAssessment.risk_index ??
        project.riskIndex ??
        project.risk_index ??
        0,

      tier:
        riskAssessment.tier ??
        project.tier ??
        "CLEAN",

      explanation: {
        ...(riskAssessment.explanation ?? {}),
        reasons: Array.isArray(reasons)
          ? reasons
          : [],
      },
    },
  };
}

function getRiskIndex(project) {
  return Number(
    project?.riskAssessment?.riskIndex ?? 0
  );
}

function getRiskTier(project) {
  return String(
    project?.riskAssessment?.tier ?? "CLEAN"
  ).toUpperCase();
}

function getRiskLabel(project) {
  const tier = getRiskTier(project);

  if (
    tier === "TIER_2" ||
    tier === "TIER-2" ||
    tier === "TIER2" ||
    tier === "HIGH"
  ) {
    return "High";
  }

  if (
    tier === "TIER_1" ||
    tier === "TIER-1" ||
    tier === "TIER1" ||
    tier === "MEDIUM"
  ) {
    return "Medium";
  }

  return "Low";
}

function getRiskClass(project) {
  const label = getRiskLabel(project);

  if (label === "High") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (label === "Medium") {
    return "bg-surface-container-high text-on-surface border-surface-container-highest";
  }

  return "bg-surface-container-low text-on-surface-variant border-surface-container-high";
}

function getPrimaryReason(project) {
  const reasons =
    project?.riskAssessment?.explanation
      ?.reasons ?? [];

  if (Array.isArray(reasons) && reasons.length) {
    return reasons[0];
  }

  const signals = Array.isArray(
    project?.riskSignals
  )
    ? project.riskSignals
    : Array.isArray(project?.risk_signals)
      ? project.risk_signals
      : [];

  if (signals.length) {
    return (
      signals[0]?.reason ??
      signals[0]?.description ??
      "Risk signal detected"
    );
  }

  return "Risk assessment available for review";
}

function getProjectName(project) {
  return (
    project?.activityName ||
    project?.description ||
    `Work ${project?.workId ?? project?.id ?? ""}`
  );
}

function getLocation(project) {
  const parts = [
    project?.state,
    project?.district,
  ].filter(Boolean);

  return parts.length
    ? parts.join(" · ")
    : "Location unavailable";
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "—";

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

function getResponseProjects(response) {
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

function getResponseTotal(response, fallback = 0) {
  const candidates = [
    response?.total,
    response?.total_count,
    response?.data?.total,
    response?.data?.total_count,
  ];

  const value = candidates.find(
    (item) =>
      item !== undefined &&
      item !== null
  );

  const numeric = Number(value);

  return Number.isFinite(numeric)
    ? numeric
    : fallback;
}

function getSummaryValue(summary, key) {
  const value = summary?.[key];

  const numeric = Number(value);

  return Number.isFinite(numeric)
    ? numeric
    : 0;
}

export default function MinistryOverview() {
  const navigate = useNavigate();

  const [summary, setSummary] =
    useState(null);

  const [projects, setProjects] =
    useState([]);

  const [totalFlagged, setTotalFlagged] =
    useState(0);

  const [totalTier2, setTotalTier2] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [
          summaryResponse,
          tier2Response,
          tier1Response,
        ] = await Promise.all([
          getMinistrySummary(),

          getMinistryProjects({
            page: 1,
            page_size: PAGE_SIZE,
            sort: "risk_desc",
            risk_tier: "TIER_2",
          }),

          getMinistryProjects({
            page: 1,
            page_size: 1,
            sort: "risk_desc",
            risk_tier: "TIER_1",
          }),
        ]);

        if (cancelled) return;

        const summaryData =
          summaryResponse?.data ??
          summaryResponse ??
          {};

        const tier2Projects =
          getResponseProjects(
            tier2Response
          ).map(normalizeProject);

        const tier2Total =
          getResponseTotal(
            tier2Response,
            tier2Projects.length
          );

        const tier1Total =
          getResponseTotal(
            tier1Response,
            0
          );

        setSummary(summaryData);
        setProjects(tier2Projects);
        setTotalTier2(tier2Total);
        setTotalFlagged(
          tier1Total + tier2Total
        );
      } catch (requestError) {
        if (cancelled) return;

        setSummary(null);
        setProjects([]);
        setTotalFlagged(0);
        setTotalTier2(0);

        setError(
          requestError?.message ||
            "Unable to load Ministry overview."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter(
      (project) => {
        const haystack = [
          project?.activityName,
          project?.description,
          project?.workId,
          project?.category,
          project?.state,
          project?.district,
          project?.constituency,
          project?.mpName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      }
    );
  }, [projects, search]);

  const totalProjects =
    getSummaryValue(
      summary,
      "total_projects"
    );

  const completedProjects =
    getSummaryValue(
      summary,
      "completed_projects"
    );

  const inProgressProjects =
    getSummaryValue(
      summary,
      "in_progress_projects"
    );

  const recommendedProjects =
    getSummaryValue(
      summary,
      "recommended_projects"
    );

  const projectsWithRisk =
    getSummaryValue(
      summary,
      "projects_with_risk_assessment"
    );

  const tierCounts =
    summary?.tier_counts ?? {};

  const tier2FromSummary =
    Number(
      tierCounts?.TIER_2 ??
      tierCounts?.tier_2 ??
      tierCounts?.TIER2 ??
      tierCounts?.tier2 ??
      0
    );

  const tier1FromSummary =
    Number(
      tierCounts?.TIER_1 ??
      tierCounts?.tier_1 ??
      tierCounts?.TIER1 ??
      tierCounts?.tier1 ??
      0
    );

  const cleanFromSummary =
    Number(
      tierCounts?.CLEAN ??
      tierCounts?.clean ??
      0
    );

  const highRisk =
    Number.isFinite(tier2FromSummary)
      ? tier2FromSummary
      : totalTier2;

  const flagged =
    totalFlagged ||
    highRisk + tier1FromSummary;

  const markup = `
    <div class="min-h-screen bg-background text-on-surface">

      <aside class="fixed top-0 bottom-0 left-0 w-64 bg-surface-container-lowest border-r border-surface-container-high flex flex-col justify-between p-4 z-30">

        <div>

          <div class="px-2 pb-5 border-b border-surface-container-high">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
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
                data-ministry-nav="/ministry/overview"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
              >
                <span class="material-symbols-outlined text-[19px]">
                  dashboard
                </span>

                <span>National Overview</span>
              </a>

              <a
                href="#"
                data-ministry-nav="/ministry/tier-2"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-sm font-medium transition-colors"
              >
                <span class="material-symbols-outlined text-[19px]">
                  summarize
                </span>

                <span>Tier-2 Digest</span>
              </a>

              <a
                href="#"
                data-ministry-nav="/ministry/benford"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-sm font-medium transition-colors"
              >
                <span class="material-symbols-outlined text-[19px]">
                  analytics
                </span>

                <span>Benford's Law</span>
              </a>

            </nav>
          </div>

          <div class="mt-6 pt-5 border-t border-surface-container-high">

            <div class="px-2 mb-2 text-label-sm uppercase tracking-wider text-outline font-semibold">
              System
            </div>

            <nav class="space-y-1">

              <button
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-sm font-medium text-left"
              >
                <span class="material-symbols-outlined text-[19px]">
                  settings
                </span>

                <span>Settings</span>
              </button>

              <button
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-sm font-medium text-left"
              >
                <span class="material-symbols-outlined text-[19px]">
                  help_outline
                </span>

                <span>Support</span>
              </button>

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

      <header class="ml-64 h-14 bg-surface-container-lowest border-b border-surface-container-high px-6 flex items-center justify-between sticky top-0 z-20">

        <div class="relative w-96">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>

          <input
            id="ministry-global-search"
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

          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
          >
            <span class="material-symbols-outlined text-[19px]">
              notifications
            </span>
          </button>

          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
          >
            <span class="material-symbols-outlined text-[19px]">
              help_outline
            </span>
          </button>

        </div>

      </header>

      <main class="ml-64 p-8 max-w-[1500px]">

        <div class="max-w-[1360px] mx-auto space-y-7">

          <section class="border-b border-surface-container-high pb-5">

            <div class="flex items-end justify-between gap-4">

              <div>

                <div class="flex items-center gap-2 text-label-sm text-on-surface-variant mb-2">
                  <span>MPLADS</span>
                  <span>/</span>
                  <span>Ministry Oversight</span>
                  <span>/</span>
                  <span class="font-semibold text-on-surface">
                    National Overview
                  </span>
                </div>

                <h1 class="text-display-lg font-bold tracking-tight">
                  National Overview
                </h1>

                <p class="text-body-md text-on-surface-variant mt-1">
                  National view of MPLADS projects and current risk assessments.
                </p>

              </div>

              <div class="text-right">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-container-high bg-surface-container-lowest">
                  <span class="w-2 h-2 rounded-full bg-secondary"></span>
                  <span class="text-label-sm font-medium text-on-surface-variant">
                    Live backend data
                  </span>
                </div>
              </div>

            </div>

          </section>

          ${
            loading
              ? `
                <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-10 text-center">
                  <div class="text-body-md font-semibold">
                    Loading Ministry overview…
                  </div>

                  <div class="text-body-sm text-on-surface-variant mt-1">
                    Reading the national summary and current Tier-2 queue.
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
                          Unable to load Ministry overview
                        </div>

                        <div class="text-body-sm text-on-surface-variant mt-1">
                          ${escapeHtml(error)}
                        </div>
                      </div>
                    </div>
                  </section>
                `
                : `
                  <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden">

                    <div class="grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-surface-container-high">

                      <div class="p-5">
                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          Projects monitored
                        </div>

                        <div class="text-3xl font-bold tabular-nums mt-2">
                          ${totalProjects.toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div class="p-5">
                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          Projects flagged
                        </div>

                        <div class="text-3xl font-bold tabular-nums mt-2">
                          ${flagged.toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div class="p-5">
                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          High-risk projects
                        </div>

                        <div class="text-3xl font-bold tabular-nums text-error mt-2">
                          ${highRisk.toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div class="p-5">
                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          Risk assessments
                        </div>

                        <div class="text-3xl font-bold tabular-nums mt-2">
                          ${projectsWithRisk.toLocaleString("en-IN")}
                        </div>
                      </div>

                      <div class="p-5">
                        <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                          Recommended
                        </div>

                        <div class="text-3xl font-bold tabular-nums mt-2">
                          ${recommendedProjects.toLocaleString("en-IN")}
                        </div>
                      </div>

                    </div>

                  </section>

                  <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    <div class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">

                      <div class="text-label-sm uppercase tracking-wider text-outline font-medium">
                        Lifecycle
                      </div>

                      <div class="mt-4 space-y-3">

                        <div class="flex items-center justify-between">
                          <span class="text-body-sm">
                            Completed
                          </span>

                          <span class="font-semibold tabular-nums">
                            ${completedProjects.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div class="flex items-center justify-between">
                          <span class="text-body-sm">
                            In progress
                          </span>

                          <span class="font-semibold tabular-nums">
                            ${inProgressProjects.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div class="flex items-center justify-between">
                          <span class="text-body-sm">
                            Recommended
                          </span>

                          <span class="font-semibold tabular-nums">
                            ${recommendedProjects.toLocaleString("en-IN")}
                          </span>
                        </div>

                      </div>

                    </div>

                    <div class="lg:col-span-2 bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">

                      <div class="flex items-center justify-between">
                        <div>
                          <h2 class="text-headline-sm font-semibold">
                            Risk distribution
                          </h2>

                          <p class="text-label-sm text-on-surface-variant mt-1">
                            Current composite risk assessment tiers.
                          </p>
                        </div>

                        <span class="text-label-sm text-on-surface-variant">
                          ${projectsWithRisk.toLocaleString("en-IN")} assessed
                        </span>
                      </div>

                      <div class="mt-5">

                        <div class="h-4 w-full rounded-full bg-surface-container-low overflow-hidden flex">

                          <div
                            class="bg-error h-full"
                            style="width: ${
                              projectsWithRisk
                                ? Math.min(
                                    100,
                                    (highRisk /
                                      projectsWithRisk) *
                                      100
                                  )
                                : 0
                            }%;"
                          ></div>

                          <div
                            class="bg-on-surface-variant h-full"
                            style="width: ${
                              projectsWithRisk
                                ? Math.min(
                                    100,
                                    (tier1FromSummary /
                                      projectsWithRisk) *
                                      100
                                  )
                                : 0
                            }%;"
                          ></div>

                          <div
                            class="bg-outline-variant h-full"
                            style="width: ${
                              projectsWithRisk
                                ? Math.min(
                                    100,
                                    (cleanFromSummary /
                                      projectsWithRisk) *
                                      100
                                  )
                                : 0
                            }%;"
                          ></div>

                        </div>

                        <div class="grid grid-cols-3 gap-4 mt-4">

                          <div>
                            <div class="flex items-center gap-2">
                              <span class="w-2 h-2 rounded-full bg-error"></span>
                              <span class="text-label-sm font-medium">
                                Tier 2
                              </span>
                            </div>

                            <div class="text-xl font-bold tabular-nums mt-1">
                              ${highRisk.toLocaleString("en-IN")}
                            </div>
                          </div>

                          <div>
                            <div class="flex items-center gap-2">
                              <span class="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                              <span class="text-label-sm font-medium">
                                Tier 1
                              </span>
                            </div>

                            <div class="text-xl font-bold tabular-nums mt-1">
                              ${tier1FromSummary.toLocaleString("en-IN")}
                            </div>
                          </div>

                          <div>
                            <div class="flex items-center gap-2">
                              <span class="w-2 h-2 rounded-full bg-outline-variant"></span>
                              <span class="text-label-sm font-medium">
                                Clean
                              </span>
                            </div>

                            <div class="text-xl font-bold tabular-nums mt-1">
                              ${cleanFromSummary.toLocaleString("en-IN")}
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>

                  </section>

                  <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden">

                    <div class="p-5 border-b border-surface-container-high">

                      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        <div>
                          <h2 class="text-headline-md font-semibold">
                            Current Tier-2 review queue
                          </h2>

                          <p class="text-body-sm text-on-surface-variant mt-1">
                            Highest-priority projects returned by the live risk assessment.
                          </p>
                        </div>

                        <div class="flex items-center gap-3">

                          <input
                            id="ministry-project-search"
                            type="search"
                            placeholder="Filter projects..."
                            class="w-56 h-9 px-3 bg-surface border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-primary"
                          />

                          <button
                            id="ministry-tier2-button"
                            type="button"
                            class="px-3 py-2 bg-primary text-white rounded-lg text-label-md font-medium hover:bg-neutral-800"
                          >
                            Open Tier-2 Digest →
                          </button>

                        </div>

                      </div>

                    </div>

                    ${
                      filteredProjects.length === 0
                        ? `
                          <div class="p-10 text-center">
                            <div class="text-body-md font-semibold">
                              No Tier-2 projects found
                            </div>

                            <div class="text-body-sm text-on-surface-variant mt-1">
                              ${
                                search
                                  ? "Try a different search."
                                  : "The current backend returned no Tier-2 projects."
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
                                    Primary reason
                                  </th>

                                  <th class="py-3 px-5 text-label-sm uppercase tracking-wider text-on-surface-variant text-right">
                                    Action
                                  </th>
                                </tr>
                              </thead>

                              <tbody class="divide-y divide-surface-container-high">

                                ${filteredProjects
                                  .map(
                                    (project) => {
                                      const riskLabel =
                                        getRiskLabel(
                                          project
                                        );

                                      const riskIndex =
                                        getRiskIndex(
                                          project
                                        );

                                      const riskClass =
                                        getRiskClass(
                                          project
                                        );

                                      return `
                                        <tr class="hover:bg-surface-container-low transition-colors">

                                          <td class="py-4 px-5 align-top">

                                            <div class="font-medium leading-snug">
                                              ${escapeHtml(
                                                getProjectName(
                                                  project
                                                )
                                              )}
                                            </div>

                                            <div class="text-label-sm text-on-surface-variant font-mono mt-1">
                                              ${escapeHtml(
                                                project?.workId ??
                                                  project?.id ??
                                                  "—"
                                              )}
                                            </div>

                                          </td>

                                          <td class="py-4 px-5 align-top text-body-sm">
                                            ${escapeHtml(
                                              getLocation(
                                                project
                                              )
                                            )}

                                            <div class="text-label-sm text-on-surface-variant mt-1">
                                              ${escapeHtml(
                                                project?.constituency ||
                                                  "Constituency unavailable"
                                              )}
                                            </div>
                                          </td>

                                          <td class="py-4 px-5 align-top text-body-sm text-on-surface-variant">
                                            ${escapeHtml(
                                              project?.category ||
                                                "—"
                                            )}
                                          </td>

                                          <td class="py-4 px-5 align-top">

                                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-label-sm font-semibold ${riskClass}">
                                              <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                                              ${escapeHtml(
                                                riskLabel
                                              )}
                                            </span>

                                            <div class="text-label-sm text-on-surface-variant mt-1 tabular-nums">
                                              Index ${escapeHtml(
                                                riskIndex
                                              )}
                                            </div>

                                          </td>

                                          <td class="py-4 px-5 align-top text-body-sm max-w-[360px]">
                                            ${escapeHtml(
                                              getPrimaryReason(
                                                project
                                              )
                                            )}
                                          </td>

                                          <td class="py-4 px-5 align-top text-right">

                                            <a
                                              href="#"
                                              class="ministry-project-view text-primary font-semibold text-label-md hover:underline"
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
                                      `;
                                    }
                                  )
                                  .join("")}

                              </tbody>

                            </table>

                          </div>

                          <div class="px-5 py-4 bg-surface-container-low border-t border-surface-container-high flex items-center justify-between">

                            <span class="text-label-sm text-on-surface-variant">
                              Showing ${filteredProjects.length} of ${totalTier2.toLocaleString("en-IN")} Tier-2 projects
                            </span>

                            <button
                              id="ministry-open-tier2-bottom"
                              type="button"
                              class="text-label-md font-semibold text-primary hover:underline"
                            >
                              Inspect complete Tier-2 queue →
                            </button>

                          </div>
                        `
                    }

                  </section>

                  <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">

                    <div class="flex items-start gap-3">

                      <span class="material-symbols-outlined text-on-surface-variant">
                        info
                      </span>

                      <div>

                        <h3 class="text-body-sm font-semibold">
                          Risk interpretation
                        </h3>

                        <p class="text-label-md text-on-surface-variant mt-1 leading-relaxed">
                          Tier-2 projects are the highest-priority results of the current composite risk assessment. A risk signal is an investigation aid, not a finding of wrongdoing. Project-level evidence should be reviewed before any administrative action.
                        </p>

                      </div>

                    </div>

                  </section>

                  <section class="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">

                      <div class="flex items-center justify-between gap-3">

                        <div>
                          <h2 class="text-headline-sm font-semibold">
                            Benford's Law
                          </h2>

                          <p class="text-body-sm text-on-surface-variant mt-1">
                            District-level statistical analysis.
                          </p>
                        </div>

                        <button
                          id="ministry-benford-button"
                          type="button"
                          class="text-label-md font-semibold text-primary hover:underline"
                        >
                          View analysis →
                        </button>

                      </div>

                    </div>

                    <div class="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">

                      <div class="flex items-center justify-between gap-3">

                        <div>
                          <h2 class="text-headline-sm font-semibold">
                            Vendor &amp; Collusion Analysis
                          </h2>

                          <p class="text-body-sm text-on-surface-variant mt-1">
                            Not currently available in the MVP.
                          </p>
                        </div>

                        <span class="text-label-sm px-2 py-1 bg-surface-container-high rounded border border-surface-container-highest">
                          Roadmap
                        </span>

                      </div>

                    </div>

                  </section>
                `
          }

          <footer class="pt-5 pb-8 border-t border-surface-container-high text-label-sm text-on-surface-variant">
            National Informatics Centre · Ministry of Statistics and Programme Implementation
          </footer>

        </div>

      </main>

    </div>
  `;

  useEffect(() => {
    const globalSearch =
      document.getElementById(
        "ministry-global-search"
      );

    const projectSearch =
      document.getElementById(
        "ministry-project-search"
      );

    const tier2Button =
      document.getElementById(
        "ministry-tier2-button"
      );

    const bottomTier2Button =
      document.getElementById(
        "ministry-open-tier2-bottom"
      );

    const benfordButton =
      document.getElementById(
        "ministry-benford-button"
      );

    const navigationLinks =
      document.querySelectorAll(
        "[data-ministry-nav]"
      );

    const projectLinks =
      document.querySelectorAll(
        ".ministry-project-view"
      );

    const onGlobalSearch = (event) => {
      const value =
        event.target.value ?? "";

      if (projectSearch) {
        projectSearch.value = value;
      }

      setSearch(value);
    };

    const onProjectSearch = (event) => {
      const value =
        event.target.value ?? "";

      if (globalSearch) {
        globalSearch.value = value;
      }

      setSearch(value);
    };

    const goTier2 = (event) => {
      event?.preventDefault();
      navigate("/ministry/tier-2");
    };

    const goBenford = (event) => {
      event?.preventDefault();
      navigate("/ministry/benford");
    };

    const goProject = (event) => {
      event.preventDefault();

      const projectId =
        event.currentTarget.dataset
          .projectId;

      if (!projectId) return;

      navigate(
        `/district/projects/${encodeURIComponent(
          projectId
        )}`
      );
    };

    const goNavigation = (event) => {
      event.preventDefault();

      const path =
        event.currentTarget.dataset
          .ministryNav;

      if (path) {
        navigate(path);
      }
    };

    globalSearch?.addEventListener(
      "input",
      onGlobalSearch
    );

    projectSearch?.addEventListener(
      "input",
      onProjectSearch
    );

    tier2Button?.addEventListener(
      "click",
      goTier2
    );

    bottomTier2Button?.addEventListener(
      "click",
      goTier2
    );

    benfordButton?.addEventListener(
      "click",
      goBenford
    );

    navigationLinks.forEach((link) =>
      link.addEventListener(
        "click",
        goNavigation
      )
    );

    projectLinks.forEach((link) =>
      link.addEventListener(
        "click",
        goProject
      )
    );

    return () => {
      globalSearch?.removeEventListener(
        "input",
        onGlobalSearch
      );

      projectSearch?.removeEventListener(
        "input",
        onProjectSearch
      );

      tier2Button?.removeEventListener(
        "click",
        goTier2
      );

      bottomTier2Button?.removeEventListener(
        "click",
        goTier2
      );

      benfordButton?.removeEventListener(
        "click",
        goBenford
      );

      navigationLinks.forEach((link) =>
        link.removeEventListener(
          "click",
          goNavigation
        )
      );

      projectLinks.forEach((link) =>
        link.removeEventListener(
          "click",
          goProject
        )
      );
    };
  }, [
    navigate,
    filteredProjects,
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
// import React from "react";
// import { useStitchNavigation } from "../navigation";

// const markup = `
// <!-- SideNavBar Component -->
// <aside class="fixed top-0 bottom-0 left-0 w-64 h-full bg-surface-container-lowest border-r border-surface-container-high flex flex-col justify-between p-space-md z-30 select-none">
// <div>
// <!-- Header / Seal Area -->
// <div class="px-space-sm pb-space-md border-b border-surface-container-high"><div class="flex items-center gap-space-sm mb-1"><div class="w-5 h-5 flex items-center justify-center border border-on-surface text-on-surface text-label-sm font-label-sm font-bold">GOI</div><span class="text-headline-sm font-headline-sm tracking-tight text-on-surface font-bold">MPLADS Portal</span></div><p class="text-label-sm font-label-sm text-on-surface-variant leading-tight">Ministry Oversight</p></div>
// <!-- Main Navigation Group -->
// <div class="mt-space-md"><div class="px-space-sm mb-2 text-label-sm font-label-sm text-outline uppercase tracking-wider">Navigation</div><nav class="flex flex-col gap-1"><a class="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-on-primary bg-primary font-medium transition-colors" href="#"><span class="material-symbols-outlined text-white" data-icon="dashboard">dashboard</span><span class="text-label-md font-label-md text-white">National Overview</span></a><a class="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" href="#"><span class="material-symbols-outlined" data-icon="summarize">summarize</span><span class="text-label-md font-label-md">Tier-2 Digest</span></a><a class="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" href="#"><span class="material-symbols-outlined" data-icon="analytics">analytics</span><span class="text-label-md font-label-md">Benford's Law</span></a></nav></div>
// <!-- Secondary Divider & Links -->
// <div class="mt-space-md pt-space-md border-t border-surface-container-high"><div class="px-space-sm mb-2 text-label-sm font-label-sm text-outline uppercase tracking-wider">System</div><nav class="flex flex-col gap-1"><a class="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" href="#"><span class="material-symbols-outlined" data-icon="settings">settings</span><span class="text-label-md font-label-md">Settings</span></a><a class="flex items-center gap-space-sm px-space-sm py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" href="#"><span class="material-symbols-outlined" data-icon="help_outline">help_outline</span><span class="text-label-md font-label-md">Support</span></a></nav></div>
// <!-- Action Button CTA -->

// </div>
// <!-- Bottom Role Indicator Card -->
// <div class="p-space-sm bg-surface-container-low border border-surface-container-high rounded"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-secondary inline-block"></span><span class="text-label-md font-label-md font-semibold text-on-surface">Ministry Oversight</span></div></div>
// </aside>
// <!-- TopNavBar Component -->
// <header class="fixed top-0 right-0 left-64 h-14 bg-surface-container-lowest border-b border-surface-container-high flex items-center justify-between px-space-lg z-20">
// <div class="flex items-center gap-space-md w-96">
// <div class="relative w-full">
// <span class="material-symbols-outlined absolute left-2.5 top-2 text-outline" data-icon="search">search</span>
// <input class="w-full pl-8 pr-space-sm py-1.5 bg-surface text-body-sm font-body-sm border border-surface-container-high rounded focus:outline-none focus:border-primary text-on-surface placeholder:text-outline-variant" placeholder="Search projects, reference codes, or locations..." type="text">
// </div>
// </div>
// <div class="flex items-center gap-space-md"><div class="flex items-center gap-2 pr-space-md border-r border-surface-container-high"><span class="w-2 h-2 rounded-full bg-secondary inline-block"></span><span class="text-label-md font-label-md font-medium text-on-surface">Ministry Oversight</span></div><div class="flex items-center gap-space-xs border-r border-surface-container-high pr-space-md"><button class="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" title="Notifications"><span class="material-symbols-outlined" data-icon="notifications">notifications</span></button><button class="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" title="Help / Documentation"><span class="material-symbols-outlined" data-icon="help_outline">help_outline</span></button></div><div class="flex items-center gap-space-sm"><button class="px-space-md py-1.5 bg-primary text-on-primary text-label-md font-label-md hover:bg-neutral-800 transition-colors flex items-center gap-1.5 rounded"><span class="material-symbols-outlined text-[15px]" data-icon="download">download</span><span class="">Export Review Dossier</span></button></div></div>
// </header>
// <!-- Main Canvas -->
// <main class="ml-64 mt-14 flex-1 p-space-xl min-h-screen bg-background overflow-y-auto">
// <div class="max-w-[1360px] mx-auto space-y-space-xl">
// <!-- Editorial Header Section -->
// <section class="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md border-b border-surface-container-high"><div><div class="flex items-center gap-2 mb-1.5 text-label-sm font-label-sm text-on-surface-variant"><span class="hover:text-on-surface">MPLADS</span><span class="">/</span><span class="hover:text-on-surface">Ministry Oversight</span><span class="">/</span><span class="text-on-surface font-semibold">National Overview</span></div><h1 class="text-display-lg font-headline-lg font-bold text-on-surface tracking-tight">National Overview</h1><p class="text-body-md font-body-md text-on-surface-variant mt-1">A national view of projects requiring attention across MPLADS.</p></div></section>
// <!-- National Summary Metric Row -->
// <section><div class="bg-surface-container-lowest border border-surface-container-high rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-container-high overflow-hidden"><div class="p-space-lg"><div class="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-2 font-medium">Projects monitored</div><div class="text-numeric-metric font-numeric-metric font-bold text-on-surface num-tabular">14,820</div></div><div class="p-space-lg"><div class="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-2 font-medium">Projects flagged</div><div class="text-numeric-metric font-numeric-metric font-bold text-on-surface num-tabular">312</div></div><div class="p-space-lg"><div class="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-2 font-medium">High-risk projects</div><div class="text-numeric-metric font-numeric-metric font-bold text-error num-tabular">47</div></div><div class="p-space-lg"><div class="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-2 font-medium">Districts with flagged activity</div><div class="text-numeric-metric font-numeric-metric font-bold text-on-surface num-tabular">28</div></div></div></section>
// <!-- Main Section: Weekly Tier-2 Digest -->
// <section class="bg-surface-container-lowest border border-surface-container-high rounded-xl">
// <!-- Section Header -->
// <div class="p-space-lg border-b border-surface-container-high"><div><h2 class="text-headline-md font-headline-md font-bold text-on-surface">Weekly Tier-2 Digest</h2><p class="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Nationally significant projects selected for review based on the latest analysis.</p></div><div class="mt-space-md p-space-sm bg-surface-container-low border border-surface-container-high rounded text-body-sm font-body-sm text-on-surface-variant flex items-start gap-2"><span class="material-symbols-outlined text-outline mt-0.5" data-icon="info">info</span><span class=""><strong>Administrative Scope:</strong> Curated and capped selection of projects exhibiting statistical anomalies for priority review. Not an exhaustive raw log.</span></div><div class="mt-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md pt-space-sm"><div class="flex flex-wrap items-center gap-space-sm"><div class="relative"><input class="text-body-sm font-body-sm pl-7 pr-space-sm py-1.5 border border-surface-container-high bg-surface-container-lowest w-56 rounded focus:outline-none focus:border-primary text-on-surface placeholder:text-outline-variant" placeholder="Filter projects or IDs..." type="text"><span class="material-symbols-outlined absolute left-2 top-2 text-outline text-[16px]" data-icon="filter_list">filter_list</span></div><select class="text-label-md font-label-md py-1.5 px-space-sm border border-surface-container-high bg-surface-container-lowest text-on-surface rounded focus:outline-none focus:border-primary"><option>All Risk Levels</option><option>High Risk</option><option>Medium Risk</option><option>Low Risk</option></select><select class="text-label-md font-label-md py-1.5 px-space-sm border border-surface-container-high bg-surface-container-lowest text-on-surface rounded focus:outline-none focus:border-primary"><option>All States</option><option>Maharashtra</option><option>Bihar</option><option>Uttar Pradesh</option><option>Karnataka</option><option>Rajasthan</option><option>Odisha</option></select></div><div class="text-label-sm font-label-sm text-on-surface-variant">Displaying <span class="font-semibold text-on-surface num-tabular">6</span> prioritized items</div></div></div>
// <!-- High-Density Operational Table -->
// <div class="overflow-x-auto">
// <table class="w-full text-left border-collapse">
// <thead>
// <tr class="bg-surface border-b border-surface-container-high text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider"><th class="py-2.5 px-space-md">PROJECT</th><th class="py-2.5 px-space-md">STATE / DISTRICT</th><th class="py-2.5 px-space-md">CATEGORY</th><th class="py-2.5 px-space-md">RISK LEVEL</th><th class="py-2.5 px-space-md">PRIMARY REASON FLAGGED</th><th class="py-2.5 px-space-md">LAST UPDATED</th><th class="py-2.5 px-space-md text-right">ACTION</th></tr>
// </thead>
// <tbody class="divide-y divide-surface-container-low text-body-sm font-body-sm text-on-surface"><tr class="hover:bg-surface transition-colors"><td class="py-3 px-space-md"><div class="font-medium text-on-surface">Community Healthcare Centre - Phase II</div><div class="text-label-sm font-label-sm text-outline num-tabular">P-2024-8819</div></td><td class="py-3 px-space-md"><div class="">Maharashtra</div><div class="text-label-sm font-label-sm text-on-surface-variant">Nagpur</div></td><td class="py-3 px-space-md text-on-surface-variant">Health &amp; Sanitation</td><td class="py-3 px-space-md"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-label-sm font-label-sm font-medium bg-red-50 text-error border border-red-200 rounded"><span class="w-1.5 h-1.5 rounded-full bg-error"></span>High</span></td><td class="py-3 px-space-md text-on-surface">Expenditure spike prior to fiscal deadline</td><td class="py-3 px-space-md text-on-surface-variant num-tabular whitespace-nowrap">2 days ago</td><td class="py-3 px-space-md text-right whitespace-nowrap"><a class="text-label-md font-label-md font-semibold text-primary hover:underline inline-flex items-center gap-1" href="#">View project <span class="material-symbols-outlined text-[14px]" data-icon="arrow_forward">arrow_forward</span></a></td></tr><tr class="hover:bg-surface transition-colors"><td class="py-3 px-space-md"><div class="font-medium text-on-surface">Rural Drinking Water &amp; Sanitation Infrastructure</div><div class="text-label-sm font-label-sm text-outline num-tabular">P-2024-4102</div></td><td class="py-3 px-space-md"><div class="">Bihar</div><div class="text-label-sm font-label-sm text-on-surface-variant">Gaya</div></td><td class="py-3 px-space-md text-on-surface-variant">Public Infrastructure</td><td class="py-3 px-space-md"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-label-sm font-label-sm font-medium bg-red-50 text-error border border-red-200 rounded"><span class="w-1.5 h-1.5 rounded-full bg-error"></span>High</span></td><td class="py-3 px-space-md text-on-surface">Repetitive disbursement near sanction threshold</td><td class="py-3 px-space-md text-on-surface-variant num-tabular whitespace-nowrap">4 days ago</td><td class="py-3 px-space-md text-right whitespace-nowrap"><a class="text-label-md font-label-md font-semibold text-primary hover:underline inline-flex items-center gap-1" href="#">View project <span class="material-symbols-outlined text-[14px]" data-icon="arrow_forward">arrow_forward</span></a></td></tr><tr class="hover:bg-surface transition-colors"><td class="py-3 px-space-md"><div class="font-medium text-on-surface">Inter-Village Access Road Construction</div><div class="text-label-sm font-label-sm text-outline num-tabular">P-2023-9120</div></td><td class="py-3 px-space-md"><div class="">Uttar Pradesh</div><div class="text-label-sm font-label-sm text-on-surface-variant">Varanasi</div></td><td class="py-3 px-space-md text-on-surface-variant">Roads &amp; Bridges</td><td class="py-3 px-space-md"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-label-sm font-label-sm font-medium bg-surface-container-high text-on-surface border border-surface-container-highest rounded"><span class="w-1.5 h-1.5 rounded-full bg-outline"></span>Medium</span></td><td class="py-3 px-space-md text-on-surface">Consecutive identical contractor billings</td><td class="py-3 px-space-md text-on-surface-variant num-tabular whitespace-nowrap">1 week ago</td><td class="py-3 px-space-md text-right whitespace-nowrap"><a class="text-label-md font-label-md font-semibold text-primary hover:underline inline-flex items-center gap-1" href="#">View project <span class="material-symbols-outlined text-[14px]" data-icon="arrow_forward">arrow_forward</span></a></td></tr><tr class="hover:bg-surface transition-colors"><td class="py-3 px-space-md"><div class="font-medium text-on-surface">District Library &amp; Digital Resource Hub</div><div class="text-label-sm font-label-sm text-outline num-tabular">P-2024-3011</div></td><td class="py-3 px-space-md"><div class="">Karnataka</div><div class="text-label-sm font-label-sm text-on-surface-variant">Belagavi</div></td><td class="py-3 px-space-md text-on-surface-variant">Education</td><td class="py-3 px-space-md"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-label-sm font-label-sm font-medium bg-surface-container-high text-on-surface border border-surface-container-highest rounded"><span class="w-1.5 h-1.5 rounded-full bg-outline"></span>Medium</span></td><td class="py-3 px-space-md text-on-surface">Irregular milestone-to-payment ratio</td><td class="py-3 px-space-md text-on-surface-variant num-tabular whitespace-nowrap">1 week ago</td><td class="py-3 px-space-md text-right whitespace-nowrap"><a class="text-label-md font-label-md font-semibold text-primary hover:underline inline-flex items-center gap-1" href="#">View project <span class="material-symbols-outlined text-[14px]" data-icon="arrow_forward">arrow_forward</span></a></td></tr><tr class="hover:bg-surface transition-colors"><td class="py-3 px-space-md"><div class="font-medium text-on-surface">Primary School Modernization Wing</div><div class="text-label-sm font-label-sm text-outline num-tabular">P-2023-7450</div></td><td class="py-3 px-space-md"><div class="">Rajasthan</div><div class="text-label-sm font-label-sm text-on-surface-variant">Alwar</div></td><td class="py-3 px-space-md text-on-surface-variant">Social Welfare</td><td class="py-3 px-space-md"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-label-sm font-label-sm font-medium bg-surface-container-high text-on-surface-variant border border-surface-container-highest rounded"><span class="w-1.5 h-1.5 rounded-full bg-outline"></span>Low</span></td><td class="py-3 px-space-md text-on-surface">Accelerated fund release variance</td><td class="py-3 px-space-md text-on-surface-variant num-tabular whitespace-nowrap">2 weeks ago</td><td class="py-3 px-space-md text-right whitespace-nowrap"><a class="text-label-md font-label-md font-semibold text-primary hover:underline inline-flex items-center gap-1" href="#">View project <span class="material-symbols-outlined text-[14px]" data-icon="arrow_forward">arrow_forward</span></a></td></tr><tr class="hover:bg-surface transition-colors"><td class="py-3 px-space-md"><div class="font-medium text-on-surface">Solar Micro-Grid Electrification Scheme</div><div class="text-label-sm font-label-sm text-outline num-tabular">P-2024-6291</div></td><td class="py-3 px-space-md"><div class="">Odisha</div><div class="text-label-sm font-label-sm text-on-surface-variant">Sambalpur</div></td><td class="py-3 px-space-md text-on-surface-variant">Renewable Energy</td><td class="py-3 px-space-md"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 text-label-sm font-label-sm font-medium bg-surface-container-high text-on-surface border border-surface-container-highest rounded"><span class="w-1.5 h-1.5 rounded-full bg-outline"></span>Medium</span></td><td class="py-3 px-space-md text-on-surface">Vendor concentration exceeding normative cluster threshold</td><td class="py-3 px-space-md text-on-surface-variant num-tabular whitespace-nowrap">2 weeks ago</td><td class="py-3 px-space-md text-right whitespace-nowrap"><a class="text-label-md font-label-md font-semibold text-primary hover:underline inline-flex items-center gap-1" href="#">View project <span class="material-symbols-outlined text-[14px]" data-icon="arrow_forward">arrow_forward</span></a></td></tr></tbody>
// </table>
// </div>
// <div class="p-space-sm bg-surface border-t border-surface-container-high flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
// <span class="">Showing 6 of 312 flagged projects</span>
// <a class="font-semibold text-primary hover:underline" href="#">Inspect complete live ledger →</a>
// </div>
// </section>
// <!-- Benford's Law Section -->
// <section class="bg-surface-container-lowest border border-surface-container-high p-space-lg rounded-xl">
// <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
// <div>
// <h2 class="text-headline-md font-headline-md text-on-surface">Benford's Law</h2>
// <p class="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Districts where leading-digit distributions differ from the expected pattern.</p>
// </div>
// <a class="text-label-md font-label-md font-semibold text-primary underline underline-offset-4 hover:text-secondary inline-flex items-center gap-1" href="#">
//             View analysis <span class="material-symbols-outlined text-[14px]" data-icon="arrow_forward">arrow_forward</span>
// </a>
// </div>
// <!-- Explanatory note -->
// <div class="border-l-2 border-outline bg-surface-container-low p-3 text-body-sm font-body-sm text-on-surface-variant mb-space-lg"><strong>Methodological Notice:</strong> A deviation from Benford’s Law is a statistical signal, not proof of fraud. Results should be reviewed alongside project-level evidence.</div>
// <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
// <!-- Flagged Districts List (7 cols) -->
// <div class="lg:col-span-7 space-y-space-sm">
// <div class="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-2">Priority Statistical Outliers</div>
// <!-- District 1 -->
// <div class="p-space-md border border-surface-container-high bg-surface flex flex-col justify-between gap-2">
// <div class="flex items-start justify-between">
// <div>
// <div class="font-semibold text-on-surface text-body-md font-body-md">District A (Bihar)</div>
// <div class="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Leading digit '1' under-represented (18% vs 30.1% expected)</div>
// </div>
// <span class="px-2 py-0.5 text-label-sm font-label-sm font-medium bg-red-50 text-error border border-red-200">
//                   Review Recommended
//                 </span>
// </div>
// <div class="flex items-center gap-space-md text-label-sm font-label-sm pt-2 border-t border-surface-container-high text-on-surface-variant">
// <span class="">p-value: <strong class="num-tabular text-on-surface">0.003</strong></span>
// <span class="">Sample Size: <strong class="num-tabular text-on-surface">412 sanctions</strong></span>
// <span class="text-error font-medium">Significant divergence (p &lt; 0.01)</span>
// </div>
// </div>
// <!-- District 2 -->
// <div class="p-space-md border border-surface-container-high bg-surface flex flex-col justify-between gap-2">
// <div class="flex items-start justify-between">
// <div>
// <div class="font-semibold text-on-surface text-body-md font-body-md">District B (Uttar Pradesh)</div>
// <div class="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Clustered disbursements starting with '9'</div>
// </div>
// <span class="px-2 py-0.5 text-label-sm font-label-sm font-medium bg-red-50 text-error border border-red-200">
//                   Review Recommended
//                 </span>
// </div>
// <div class="flex items-center gap-space-md text-label-sm font-label-sm pt-2 border-t border-surface-container-high text-on-surface-variant">
// <span class="">p-value: <strong class="num-tabular text-on-surface">0.007</strong></span>
// <span class="">Sample Size: <strong class="num-tabular text-on-surface">328 sanctions</strong></span>
// <span class="text-error font-medium">Significant divergence (p &lt; 0.01)</span>
// </div>
// </div>
// <!-- District 3 -->
// <div class="p-space-md border border-surface-container-high bg-surface flex flex-col justify-between gap-2">
// <div class="flex items-start justify-between">
// <div>
// <div class="font-semibold text-on-surface text-body-md font-body-md">District C (Maharashtra)</div>
// <div class="text-label-sm font-label-sm text-on-surface-variant mt-0.5">Uniform distribution bias across sanctioned works</div>
// </div>
// <span class="px-2 py-0.5 text-label-sm font-label-sm font-medium bg-surface-container-high text-on-surface-variant border border-surface-container-highest">
//                   Monitored
//                 </span>
// </div>
// <div class="flex items-center gap-space-md text-label-sm font-label-sm pt-2 border-t border-surface-container-high text-on-surface-variant">
// <span class="">p-value: <strong class="num-tabular text-on-surface">0.014</strong></span>
// <span class="">Sample Size: <strong class="num-tabular text-on-surface">519 sanctions</strong></span>
// <span class="text-on-surface-variant">Under observation</span>
// </div>
// </div>
// </div>
// <!-- Bar Visualization (5 cols) -->
// <div class="lg:col-span-5 p-space-md border border-surface-container-high bg-surface flex flex-col justify-between">
// <div>
// <div class="flex items-center justify-between mb-1">
// <span class="text-label-sm font-label-sm text-outline uppercase tracking-wider">Leading Digit Distribution</span>
// <span class="text-label-sm font-label-sm text-on-surface-variant">District A vs Baseline</span>
// </div>
// <div class="text-body-sm font-body-sm text-on-surface-variant mb-4">First-digit frequency comparison (%)</div>
// <!-- Bar Chart Comparison -->
// <div class="space-y-2">
// <!-- Digit 1 -->
// <div>
// <div class="flex justify-between text-label-sm font-label-sm mb-0.5">
// <span class="font-semibold">Digit 1</span>
// <span class="num-tabular text-on-surface-variant">Observed: 18.0% | Expected: 30.1%</span>
// </div>
// <div class="w-full bg-surface-container-high h-4 relative flex items-center">
// <div class="bg-primary h-full" style="width: 18%;"></div>
// <div class="absolute h-6 w-0.5 bg-secondary z-10 -top-1" style="left: 30.1%;" title="Expected: 30.1%"></div>
// </div>
// </div>
// <!-- Digit 2 -->
// <div>
// <div class="flex justify-between text-label-sm font-label-sm mb-0.5">
// <span class="font-semibold">Digit 2</span>
// <span class="num-tabular text-on-surface-variant">Observed: 16.5% | Expected: 17.6%</span>
// </div>
// <div class="w-full bg-surface-container-high h-4 relative flex items-center">
// <div class="bg-primary h-full" style="width: 16.5%;"></div>
// <div class="absolute h-6 w-0.5 bg-secondary z-10 -top-1" style="left: 17.6%;" title="Expected: 17.6%"></div>
// </div>
// </div>
// <!-- Digit 3 -->
// <div>
// <div class="flex justify-between text-label-sm font-label-sm mb-0.5">
// <span class="font-semibold">Digit 3</span>
// <span class="num-tabular text-on-surface-variant">Observed: 11.8% | Expected: 12.5%</span>
// </div>
// <div class="w-full bg-surface-container-high h-4 relative flex items-center">
// <div class="bg-primary h-full" style="width: 11.8%;"></div>
// <div class="absolute h-6 w-0.5 bg-secondary z-10 -top-1" style="left: 12.5%;" title="Expected: 12.5%"></div>
// </div>
// </div>
// <!-- Digit 4 -->
// <div>
// <div class="flex justify-between text-label-sm font-label-sm mb-0.5">
// <span class="font-semibold">Digit 4</span>
// <span class="num-tabular text-on-surface-variant">Observed: 8.9% | Expected: 9.7%</span>
// </div>
// <div class="w-full bg-surface-container-high h-4 relative flex items-center">
// <div class="bg-primary h-full" style="width: 8.9%;"></div>
// <div class="absolute h-6 w-0.5 bg-secondary z-10 -top-1" style="left: 9.7%;" title="Expected: 9.7%"></div>
// </div>
// </div>
// <!-- Digit 9 (Clustered) -->
// <div>
// <div class="flex justify-between text-label-sm font-label-sm mb-0.5">
// <span class="font-semibold">Digit 9</span>
// <span class="num-tabular text-on-surface-variant">Observed: 14.2% | Expected: 4.6%</span>
// </div>
// <div class="w-full bg-surface-container-high h-4 relative flex items-center">
// <div class="bg-error h-full" style="width: 14.2%;"></div>
// <div class="absolute h-6 w-0.5 bg-secondary z-10 -top-1" style="left: 4.6%;" title="Expected: 4.6%"></div>
// </div>
// </div>
// </div>
// </div>
// <!-- Legend -->
// <div class="mt-4 pt-3 border-t border-surface-container-high flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
// <div class="flex items-center gap-1.5">
// <span class="w-3 h-3 bg-primary inline-block"></span>
// <span class="">Observed Frequency</span>
// </div>
// <div class="flex items-center gap-1.5">
// <span class="w-2 h-0.5 bg-secondary inline-block"></span>
// <span class="text-secondary font-medium">Expected Benford Value</span>
// </div>
// </div>
// </div>
// </div>
// </section>
// <!-- Roadmap / Unavailable Capabilities -->
// <section class="pb-space-xl"><div class="mb-space-md"><h2 class="text-headline-md font-headline-md font-bold text-on-surface">Additional analysis</h2><p class="text-body-sm font-body-sm text-on-surface-variant mt-0.5">The following specialized analytical modules are currently in development and not yet available in this release.</p></div><div class="grid grid-cols-1 md:grid-cols-2 gap-space-lg"><div class="p-space-lg border border-surface-container-high rounded-xl bg-surface-container-lowest flex flex-col justify-between"><div><div class="flex items-center justify-between mb-2"><div class="text-headline-sm font-headline-sm font-semibold text-on-surface">Vendor &amp; Collusion Analysis</div><span class="text-label-sm font-label-sm px-2 py-0.5 bg-surface-container-high text-on-surface-variant border border-surface-container-highest rounded">Not currently available</span></div><p class="text-body-sm font-body-sm text-on-surface-variant mt-2 leading-relaxed">Vendor relationship analysis is not yet available. Graph-based entity resolution and contractor syndication mapping will be available in future releases.</p></div></div><div class="p-space-lg border border-surface-container-high rounded-xl bg-surface-container-lowest flex flex-col justify-between"><div><div class="flex items-center justify-between mb-2"><div class="text-headline-sm font-headline-sm font-semibold text-on-surface">RAG Assistant</div><span class="text-label-sm font-label-sm px-2 py-0.5 bg-surface-container-high text-on-surface-variant border border-surface-container-highest rounded">Not currently available</span></div><p class="text-body-sm font-body-sm text-on-surface-variant mt-2 leading-relaxed">Natural-language investigation assistance is not yet available. Retrieval-augmented query synthesis over project documentation and audit archives is currently undergoing validation.</p></div></div></div></section>
// <!-- Institutional Footer Note -->
// <footer class="pt-space-md border-t border-surface-container-high flex flex-col md:flex-row items-center justify-between text-label-sm font-label-sm text-outline pb-space-lg"><div class="">National Informatics Centre · Ministry of Statistics and Programme Implementation</div></footer>
// </div>
// </main>


// `;

// export default function MinistryOverview() {
//   useStitchNavigation();
//   return (
//     <div
//       className="stitch-page-root"
//       dangerouslySetInnerHTML={{ __html: markup }}
//     />
//   );
// }
