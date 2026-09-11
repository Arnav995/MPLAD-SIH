import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStitchNavigation } from "../navigation";

import { getDistrictOverview } from "../api/district";
import {
  formatCurrency,
  getLocation,
  getPrimaryReason,
  getRiskLabel,
  getRiskTier,
} from "../api/helpers";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRiskBadge(project) {
  const tier = getRiskTier(project);
  const label = getRiskLabel(tier);

  if (tier === "TIER_2") {
    return `
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-label-sm font-label-sm bg-error-container text-on-error-container border border-error/20">
        <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
        ${escapeHtml(label)}
      </span>
    `;
  }

  if (tier === "TIER_1") {
    return `
      <span class="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant border border-outline-variant">
        ${escapeHtml(label)}
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface-variant border border-outline-variant">
      ${escapeHtml(label)}
    </span>
  `;
}

function renderProjectRows(projects) {
  if (!projects.length) {
    return `
      <tr>
        <td
          colspan="7"
          class="px-4 py-8 text-center text-body-sm text-on-surface-variant"
        >
          No projects requiring review.
        </td>
      </tr>
    `;
  }

  return projects
    .map((project) => {
      const projectId = escapeHtml(project.id);

      const activityName = escapeHtml(
        project.activityName || "Untitled project"
      );

      const referenceId = escapeHtml(
        project.workId ||
          project.recommendationDtlId ||
          project.id
      );

      const location = escapeHtml(
        getLocation(project) ||
          project.constituencyNameFromSource ||
          project.stateNameFromSource ||
          "—"
      );

      const category = escapeHtml(
        project.category || "—"
      );

      const reason = escapeHtml(
        getPrimaryReason(project) ||
          "Risk assessment requires review"
      );

      const amount = formatCurrency(
        project.sanctionAmount ??
          project.recommendedAmount ??
          project.actualAmount
      );

      return `
        <tr class="hover:bg-surface-bright transition-colors">
          <td class="px-4 py-3 text-body-sm font-medium text-on-surface">
            ${activityName}
            <span class="block text-label-sm text-on-surface-variant font-normal">
              ${referenceId}
            </span>
          </td>

          <td class="px-4 py-3 text-body-sm text-on-surface">
            ${location}
          </td>

          <td class="px-4 py-3 text-body-sm text-on-surface-variant">
            ${category}
          </td>

          <td class="px-4 py-3 text-body-sm font-medium text-on-surface text-right num-tabular">
            ${amount}
          </td>

          <td class="px-4 py-3">
            ${renderRiskBadge(project)}
          </td>

          <td class="px-4 py-3 text-body-sm text-on-surface-variant">
            ${reason}
          </td>

          <td class="px-4 py-3 text-right">
            <a
              href="/district/projects/${projectId}"
              data-work-id="${projectId}"
              class="text-label-md font-label-md font-medium text-primary hover:underline"
            >
              View →
            </a>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderMarkup({
  districtName,
  totalProjects,
  flaggedProjects,
  highRiskProjects,
  reviewProjects,
  projects,
}) {
  return `
    <!-- SIDEBAR NAVIGATION -->
    <aside class="fixed top-0 left-0 h-screen w-64 flex flex-col justify-between bg-surface-container-lowest border-r border-outline-variant z-40 shrink-0">
      <div class="p-4 flex flex-col">

        <!-- Seal and Brand Header -->
        <div class="flex items-center gap-3 pb-5 mb-4 border-b border-surface-container">
          <div class="w-9 h-9 bg-surface-container-low rounded-lg border border-outline-variant flex items-center justify-center shrink-0">
            <span
              class="material-symbols-outlined text-primary text-[20px]"
              data-icon="account_balance"
            >
              account_balance
            </span>
          </div>

          <div class="flex flex-col">
            <span class="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight leading-tight">
              MPLADS Portal
            </span>

            <span class="text-label-sm font-label-sm text-on-surface-variant">
              District Authority Oversight
            </span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex flex-col space-y-1">

          <a
            class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-primary text-on-primary font-headline-sm text-body-md transition-all duration-150"
            href="#overview"
          >
            <span
              class="material-symbols-outlined text-[20px] text-white"
              data-icon="dashboard"
            >
              dashboard
            </span>
            <span>District Overview</span>
          </a>

          <a
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 text-body-md font-body-md"
            href="/district/projects"
          >
            <span
              class="material-symbols-outlined text-[20px]"
              data-icon="fact_check"
            >
              fact_check
            </span>
            <span>Project Verification</span>
          </a>

          <a
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 text-body-md font-body-md"
            href="/district/duplicates"
          >
            <span
              class="material-symbols-outlined text-[20px]"
              data-icon="content_copy"
            >
              content_copy
            </span>
            <span>Duplicate Detection</span>
          </a>

          <a
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 text-body-md font-body-md"
            href="/district/cost-anomalies"
          >
            <span
              class="material-symbols-outlined text-[20px]"
              data-icon="monitoring"
            >
              monitoring
            </span>
            <span>Cost Anomalies</span>
          </a>
        </nav>
      </div>

      <!-- Bottom Sidebar -->
      <div class="p-4 border-t border-surface-container space-y-3">

        <div class="space-y-0.5">
          <a
            class="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg text-label-md font-label-md transition-colors duration-150"
            href="#settings"
          >
            <span
              class="material-symbols-outlined text-[18px]"
              data-icon="settings"
            >
              settings
            </span>
            <span>Settings</span>
          </a>

          <a
            class="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg text-label-md font-label-md transition-colors duration-150"
            href="#support"
          >
            <span
              class="material-symbols-outlined text-[18px]"
              data-icon="help_outline"
            >
              help_outline
            </span>
            <span>Support</span>
          </a>
        </div>

        <!-- District Authority Role Status -->
        <div class="bg-surface-container-low border border-outline-variant p-2.5 rounded-lg flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-label-sm font-bold">
              DA
            </div>

            <div class="flex flex-col">
              <span class="text-label-md font-label-md font-semibold text-on-surface leading-tight">
                District Authority
              </span>

              <span class="text-label-sm font-label-sm text-on-surface-variant">
                ${escapeHtml(districtName)}
              </span>
            </div>
          </div>

          <div
            class="w-2 h-2 rounded-full bg-secondary"
            title="Authenticated"
          ></div>
        </div>
      </div>
    </aside>

    <!-- MAIN WORKSPACE -->
    <div class="ml-64 flex-1 flex flex-col min-w-0 bg-background">

      <!-- TOP APPLICATION BAR -->
      <header class="sticky top-0 z-30 flex justify-between items-center w-full px-6 h-14 bg-surface-container-lowest border-b border-outline-variant">

        <div class="flex items-center w-96">
          <div class="relative w-full">
            <span
              class="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant"
              data-icon="search"
            >
              search
            </span>

            <input
              class="w-full h-9 pl-9 pr-3 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
              placeholder="Search projects, work codes, or locations..."
              type="text"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">

          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-on-surface text-label-sm font-label-sm border border-outline-variant">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            District Authority
          </span>

          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            title="Notifications"
            type="button"
          >
            <span
              class="material-symbols-outlined text-[20px]"
              data-icon="notifications"
            >
              notifications
            </span>
          </button>

          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            title="Help"
            type="button"
          >
            <span
              class="material-symbols-outlined text-[20px]"
              data-icon="help"
            >
              help
            </span>
          </button>
        </div>
      </header>

      <!-- CONTENT -->
      <main class="p-6 max-w-7xl w-full mx-auto space-y-6">

        <!-- SCREEN HEADER -->
        <div class="flex flex-col gap-1">

          <div class="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
            <span>MPLADS</span>
            <span>/</span>
            <span>District Oversight</span>
            <span>/</span>
            <span class="text-on-surface font-medium">
              ${escapeHtml(districtName)}
            </span>
          </div>

          <div class="flex items-baseline justify-between">
            <div>
              <h1 class="text-headline-lg font-headline-lg text-on-surface tracking-tight">
                District Overview
              </h1>

              <p class="text-body-md font-body-md text-on-surface-variant mt-0.5">
                Review flagged MPLADS projects and investigate spending anomalies within your district.
              </p>
            </div>
          </div>
        </div>

        <!-- DISTRICT SUMMARY -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-surface-container-lowest p-5 rounded-lg border border-outline-variant divide-y sm:divide-y-0 sm:divide-x divide-surface-container">

          <div class="px-3 py-1 first:pl-0">
            <div class="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
              Total Projects
            </div>

            <div class="mt-1 flex items-baseline justify-between">
              <span class="text-numeric-metric font-numeric-metric font-bold text-on-surface num-tabular">
                ${totalProjects}
              </span>

              <span class="text-label-sm font-label-sm text-on-surface-variant">
                In district
              </span>
            </div>
          </div>

          <div class="px-3 py-1 sm:pl-4">
            <div class="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
              Flagged Projects
            </div>

            <div class="mt-1 flex items-baseline justify-between">
              <span class="text-numeric-metric font-numeric-metric font-bold text-on-surface num-tabular">
                ${flaggedProjects}
              </span>

              <span class="text-label-sm font-label-sm text-on-surface-variant">
                Requires review
              </span>
            </div>
          </div>

          <div class="px-3 py-1 sm:pl-4">
            <div class="flex items-center gap-1.5">
              <span class="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                High Risk
              </span>

              <span class="w-1.5 h-1.5 rounded-full bg-error inline-block"></span>
            </div>

            <div class="mt-1 flex items-baseline justify-between">
              <span class="text-numeric-metric font-numeric-metric font-bold text-error num-tabular">
                ${highRiskProjects}
              </span>

              <span class="text-label-sm font-label-sm text-on-surface-variant">
                Requires attention
              </span>
            </div>
          </div>

          <div class="px-3 py-1 sm:pl-4">
            <div class="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
              Projects Requiring Review
            </div>

            <div class="mt-1 flex items-baseline justify-between">
              <span class="text-numeric-metric font-numeric-metric font-bold text-on-surface num-tabular">
                ${reviewProjects}
              </span>

              <span class="text-label-sm font-label-sm text-on-surface-variant">
                Tier 1 + Tier 2
              </span>
            </div>
          </div>

        </section>

        <!-- PROJECT FILTERS -->
        <section class="bg-surface-container-lowest p-3 rounded-[10px] border border-outline-variant flex flex-wrap items-center gap-3">

          <div class="relative flex-1 min-w-[220px]">
            <span
              class="material-symbols-outlined absolute left-2.5 top-2.5 text-[16px] text-on-surface-variant"
              data-icon="search"
            >
              search
            </span>

            <input
              class="w-full h-9 pl-8 pr-3 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              placeholder="Search projects..."
              type="text"
            />
          </div>

          <div class="w-36">
            <select
              class="w-full h-9 px-3 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
            >
              <option>Risk: All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <div class="w-48">
            <select
              class="w-full h-9 px-3 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
            >
              <option>Category: All</option>
              <option>Community Infrastructure</option>
              <option>Roads &amp; Bridges</option>
              <option>Drinking Water</option>
              <option>Rural Electrification</option>
              <option>Education &amp; Public Facilities</option>
            </select>
          </div>

          <div class="w-36">
            <select
              class="w-full h-9 px-3 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
            >
              <option>Status: All</option>
              <option>Under Audit</option>
              <option>Sanctioned</option>
              <option>Pending Clearance</option>
            </select>
          </div>

          <button
            class="h-9 px-3 text-label-md font-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
            type="button"
          >
            Clear Filters
          </button>
        </section>

        <!-- PROJECTS REQUIRING REVIEW -->
        <section class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">

          <div class="p-4 border-b border-outline-variant flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-headline-sm font-headline-sm text-on-surface">
                Projects Requiring Review
              </h2>

              <span class="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-on-surface font-semibold">
                ${reviewProjects}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">

              <thead>
                <tr class="bg-surface-container-low/50 border-b border-outline-variant h-9">
                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Project
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Location
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Category
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Sanctioned Amount
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Risk
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Why Flagged
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-surface-container">
                ${renderProjectRows(projects)}
              </tbody>

            </table>
          </div>
        </section>

        <!-- POTENTIAL DUPLICATE WORKS -->
        <section class="space-y-3">

          <div>
            <h2 class="text-headline-sm font-headline-sm text-on-surface">
              Potential Duplicate Works
            </h2>

            <p class="text-body-sm font-body-sm text-on-surface-variant">
              Side-by-side comparison of overlapping proposals identified for review
            </p>
          </div>

          <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-5">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-primary text-[20px]">
                content_copy
              </span>

              <div>
                <div class="text-body-sm font-medium text-on-surface">
                  Duplicate analysis available
                </div>

                <div class="text-label-sm text-on-surface-variant mt-1">
                  Open Duplicate Detection for the current candidate set.
                </div>
              </div>
            </div>

            <div class="mt-4">
              <a
                href="/district/duplicates"
                class="text-label-md font-label-md font-medium text-primary hover:underline"
              >
                Review duplicate candidates →
              </a>
            </div>
          </div>

        </section>

        <!-- COST ANOMALIES -->
        <section class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">

          <div class="p-4 border-b border-outline-variant">
            <h2 class="text-headline-sm font-headline-sm text-on-surface">
              Cost Anomalies
            </h2>

            <p class="text-body-sm font-body-sm text-on-surface-variant">
              Projects with cost-related risk signals identified by the backend assessment.
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">

              <thead>
                <tr class="bg-surface-container-low/50 border-b border-outline-variant h-9">
                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Project
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Category
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Project Cost
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Risk Signal
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Reason
                  </th>

                  <th class="px-4 py-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-surface-container">
                ${
                  projects.filter(
                    (project) =>
                      Number(
                        project?.riskAssessment
                          ?.primaryAnchors?.costScore ?? 0
                      ) > 0
                  ).length
                    ? projects
                        .filter(
                          (project) =>
                            Number(
                              project?.riskAssessment
                                ?.primaryAnchors?.costScore ?? 0
                            ) > 0
                        )
                        .map((project) => {
                          const id = escapeHtml(project.id);
                          const activity = escapeHtml(
                            project.activityName ||
                              "Untitled project"
                          );
                          const category = escapeHtml(
                            project.category || "—"
                          );
                          const amount = formatCurrency(
                            project.sanctionAmount ??
                              project.recommendedAmount
                          );
                          const reason = escapeHtml(
                            getPrimaryReason(project) ||
                              "Cost anomaly signal detected."
                          );

                          return `
                            <tr class="hover:bg-surface-bright transition-colors">
                              <td class="px-4 py-3 text-body-sm font-medium text-on-surface">
                                ${activity}
                              </td>

                              <td class="px-4 py-3 text-body-sm text-on-surface-variant">
                                ${category}
                              </td>

                              <td class="px-4 py-3 text-body-sm font-medium text-on-surface text-right num-tabular">
                                ${amount}
                              </td>

                              <td class="px-4 py-3">
                                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-label-sm font-label-sm bg-error-container text-on-error-container border border-error/20">
                                  <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                                  Cost anomaly
                                </span>
                              </td>

                              <td class="px-4 py-3 text-body-sm text-on-surface-variant">
                                ${reason}
                              </td>

                              <td class="px-4 py-3 text-right">
                                <a
                                  href="/district/projects/${id}"
                                  data-work-id="${id}"
                                  class="text-label-md font-label-md font-medium text-primary hover:underline"
                                >
                                  View →
                                </a>
                              </td>
                            </tr>
                          `;
                        })
                        .join("")
                    : `
                      <tr>
                        <td
                          colspan="6"
                          class="px-4 py-8 text-center text-body-sm text-on-surface-variant"
                        >
                          No cost anomaly projects in the current result set.
                        </td>
                      </tr>
                    `
                }
              </tbody>

            </table>
          </div>
        </section>

        <!-- FOOTER -->
        <footer class="pt-6 pb-8 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between text-label-sm font-label-sm text-on-surface-variant gap-2">

          <div class="flex items-center gap-2">
            <span>
              National Informatics Centre · Ministry of Statistics and Programme Implementation
            </span>
          </div>

          <div>
            <span>
              Government of India Oversight Framework
            </span>
          </div>

        </footer>

      </main>
    </div>
  `;
}

export default function DistrictOverview() {
  useStitchNavigation();

  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const [totalProjects, setTotalProjects] = useState(0);
  const [flaggedProjects, setFlaggedProjects] = useState(0);
  const [highRiskProjects, setHighRiskProjects] = useState(0);
  const [reviewProjects, setReviewProjects] = useState(0);

  const [districtName, setDistrictName] = useState("District Authority");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDistrictOverview() {
      try {
        setLoading(true);
        setError("");

        const [
          allResponse,
          tier2Response,
          tier1Response,
        ] = await Promise.all([
          getDistrictOverview({
            page: 1,
            page_size: 10,
            sort: "risk_desc",
          }),

          getDistrictOverview({
            page: 1,
            page_size: 1,
            risk_tier: "TIER_2",
            sort: "risk_desc",
          }),

          getDistrictOverview({
            page: 1,
            page_size: 1,
            risk_tier: "TIER_1",
            sort: "risk_desc",
          }),
        ]);

        if (cancelled) return;

        const loadedProjects =
          allResponse?.projects ?? [];

        const total = Number(
          allResponse?.total ?? 0
        );

        const tier2Total = Number(
          tier2Response?.total ?? 0
        );

        const tier1Total = Number(
          tier1Response?.total ?? 0
        );

        const flaggedTotal =
          tier1Total + tier2Total;

        setProjects(loadedProjects);

        setTotalProjects(total);

        setHighRiskProjects(tier2Total);

        setFlaggedProjects(flaggedTotal);

        setReviewProjects(flaggedTotal);

        const firstProject =
          loadedProjects[0];

        if (firstProject) {
          const sourceDistrict =
            firstProject.idaNameFromSource;

          if (sourceDistrict) {
            setDistrictName(
              sourceDistrict.split("(")[0].trim()
            );
          } else if (
            firstProject.constituencyNameFromSource
          ) {
            setDistrictName(
              firstProject.constituencyNameFromSource
            );
          } else if (
            firstProject.stateNameFromSource
          ) {
            setDistrictName(
              firstProject.stateNameFromSource
            );
          }
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load district overview:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load district overview."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDistrictOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-on-surface-variant">
        Loading district overview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-lg w-full border border-outline-variant rounded-lg bg-surface-container-lowest p-6">
          <h1 className="text-lg font-semibold text-on-surface">
            Unable to load district data
          </h1>

          <p className="mt-2 text-sm text-error">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const html = renderMarkup({
    districtName,
    totalProjects,
    flaggedProjects,
    highRiskProjects,
    reviewProjects,
    projects,
  });

  return (
    <div
      className="stitch-page-root"
      dangerouslySetInnerHTML={{
        __html: html,
      }}
      onClick={(event) => {
        const target =
          event.target.closest(
            "a[data-work-id]"
          );

        if (!target) return;

        event.preventDefault();

        navigate(
          `/district/projects/${target.dataset.workId}`
        );
      }}
    />
  );
}