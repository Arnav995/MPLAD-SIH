import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStitchNavigation } from "../navigation";

//   getPrimaryReason,

import { getProject } from "../api/district";
import {
  formatCurrency,
  formatDate,
  getLocation,
  getRiskIndex,
  getRiskLabel,
  getRiskReasons,
  getRiskSignals,
  getRiskTier,
  hasSignal,
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
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-error-container text-on-error-container border border-error/20">
        <span class="w-2 h-2 rounded-full bg-error"></span>
        <span class="text-label-sm font-label-sm tracking-wider font-semibold">
          ${escapeHtml(label)}
        </span>
      </span>
    `;
  }

  if (tier === "TIER_1") {
    return `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-on-surface border border-outline-variant">
        <span class="w-2 h-2 rounded-full bg-outline"></span>
        <span class="text-label-sm font-label-sm tracking-wider font-semibold">
          ${escapeHtml(label)}
        </span>
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-on-surface border border-outline-variant">
      <span class="w-2 h-2 rounded-full bg-secondary"></span>
      <span class="text-label-sm font-label-sm tracking-wider font-semibold">
        ${escapeHtml(label)}
      </span>
    </span>
  `;
}

function renderSignalRows(project) {
  const signals = getRiskSignals(project);

  if (!signals.length) {
    return `
      <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-[18px]">
            check_circle
          </span>
          <span class="text-body-sm font-medium text-on-surface">
            No individual risk signals were returned for this project.
          </span>
        </div>
      </div>
    `;
  }

  return signals
    .map((signal) => {
      const severity = String(
        signal.severity || "MEDIUM"
      ).toUpperCase();

      const severityClass =
        severity === "HIGH"
          ? "text-error"
          : severity === "MEDIUM"
            ? "text-on-surface"
            : "text-on-surface-variant";

      const dotClass =
        severity === "HIGH"
          ? "bg-error"
          : severity === "MEDIUM"
            ? "bg-outline"
            : "bg-secondary";

      return `
        <div class="border border-outline-variant rounded-lg p-4 bg-surface-container-lowest">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 min-w-0">
              <span class="w-2 h-2 rounded-full ${dotClass} mt-1.5 shrink-0"></span>

              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-label-sm font-label-sm font-semibold text-on-surface">
                    ${escapeHtml(signal.type || "Risk signal")}
                  </span>

                  <span class="text-label-sm font-label-sm uppercase ${severityClass}">
                    ${escapeHtml(severity)}
                  </span>
                </div>

                <p class="mt-1 text-body-sm text-on-surface-variant leading-relaxed">
                  ${escapeHtml(
                    signal.reason ||
                      "Risk signal detected."
                  )}
                </p>
              </div>
            </div>

            ${
              signal.score !== undefined &&
              signal.score !== null
                ? `
                  <span class="text-label-sm font-label-sm font-semibold text-on-surface tabular-nums shrink-0">
                    Score ${escapeHtml(signal.score)}
                  </span>
                `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderDuplicateCandidates(project) {
  const candidates = [
    ...(project?.duplicateCandidatesA || []),
    ...(project?.duplicateCandidatesB || []),
  ];

  if (!candidates.length) {
    return `
      <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-[18px]">
            content_copy
          </span>

          <span class="text-body-sm text-on-surface-variant">
            No duplicate candidates are attached to this project.
          </span>
        </div>
      </div>
    `;
  }

  return candidates
    .map((candidate) => {
      const matchedProject =
        candidate.matchedWork ||
        candidate.matchedProject ||
        candidate.project ||
        {};

      const matchedId =
        candidate.matchedWorkId ||
        matchedProject.id ||
        candidate.workId ||
        "—";

      const matchedActivity =
        candidate.activityName ||
        matchedProject.activityName ||
        candidate.matchedActivityName ||
        "Related project";

      const suspicionScore =
        candidate.suspicionScore ??
        candidate.score ??
        candidate.similarityScore;

      return `
        <div class="border border-outline-variant rounded-lg p-4 bg-surface-container-lowest">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

            <div class="min-w-0">
              <span class="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant">
                Related project
              </span>

              <h3 class="mt-1 text-body-sm font-semibold text-on-surface">
                ${escapeHtml(matchedActivity)}
              </h3>

              <p class="mt-1 text-label-sm text-on-surface-variant font-mono">
                Work ID: ${escapeHtml(matchedId)}
              </p>
            </div>

            ${
              suspicionScore !== undefined &&
              suspicionScore !== null
                ? `
                  <span class="inline-flex items-center px-2 py-1 rounded bg-error-container text-on-error-container text-label-sm font-semibold shrink-0">
                    Suspicion ${escapeHtml(suspicionScore)}
                  </span>
                `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderExpenditures(project) {
  const expenditures = project?.expenditures || [];

  if (!expenditures.length) {
    return `
      <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant text-body-sm text-on-surface-variant">
        No expenditure records returned for this project.
      </div>
    `;
  }

  return expenditures
    .map((item) => {
      const amount =
        item.amount ??
        item.actualAmount ??
        item.value;

      return `
        <div class="flex items-center justify-between gap-4 py-3 border-b border-outline-variant last:border-b-0">
          <div class="min-w-0">
            <div class="text-body-sm font-medium text-on-surface">
              ${escapeHtml(
                item.description ||
                  item.category ||
                  item.name ||
                  "Expenditure"
              )}
            </div>

            ${
              item.date
                ? `
                  <div class="text-label-sm text-on-surface-variant mt-0.5">
                    ${escapeHtml(formatDate(item.date))}
                  </div>
                `
                : ""
            }
          </div>

          <div class="text-body-sm font-semibold text-on-surface tabular-nums shrink-0">
            ${formatCurrency(amount)}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMarkup(project) {
  const tier = getRiskTier(project);
  const riskIndex = getRiskIndex(project);
  const riskLabel = getRiskLabel(tier);

  const activityName = escapeHtml(
    project.activityName ||
      "Untitled project"
  );

  const workId = escapeHtml(
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

  const description = escapeHtml(
    project.description ||
      "No project description was returned."
  );

  const implementingAgency = escapeHtml(
    project.idaNameFromSource ||
      project.implementingAgency ||
      "—"
  );

  const stateName = escapeHtml(
    project.stateNameFromSource || "—"
  );

  const constituency = escapeHtml(
    project.constituencyNameFromSource || "—"
  );

  const mpName = escapeHtml(
    project.mpNameFromSource || "—"
  );

  const recommendationDate = escapeHtml(
    formatDate(project.recommendationDate)
  );

  const sanctionDate = escapeHtml(
    formatDate(project.sanctionDate)
  );

  const completionDate = escapeHtml(
    formatDate(project.completionDate)
  );

  const lifecycleStatus = escapeHtml(
  project.lifecycleStatus ||
    project.lifecycle_status ||
    (project.completionDate
      ? "COMPLETED"
      : project.sanctionDate
        ? "SANCTIONED"
        : project.recommendationDate
          ? "RECOMMENDED"
          : "UNKNOWN")
);

  const sanctionedAmount = formatCurrency(
    project.sanctionAmount
  );

  const recommendedAmount = formatCurrency(
    project.recommendedAmount
  );

  const actualAmount = formatCurrency(
    project.actualAmount
  );

  const reasons = getRiskReasons(project);

  const hasDuplicate =
    hasSignal(project, "DUPLICATE_OVERLAP") ||
    Number(
      project?.riskAssessment?.primaryAnchors
        ?.duplicateScore ?? 0
    ) > 0;

  const hasCost =
    hasSignal(project, "COST_ANOMALY") ||
    Number(
      project?.riskAssessment?.primaryAnchors
        ?.costScore ?? 0
    ) > 0;

  return `
    <div class="flex h-screen overflow-hidden">

      <!-- SIDEBAR -->
      <aside class="w-64 h-full bg-surface-container-lowest border-r border-outline-variant/50 flex flex-col justify-between shrink-0 z-20">

        <div class="flex flex-col">

          <div class="h-16 flex items-center gap-3 px-5 border-b border-outline-variant/30">
            <div class="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary border border-outline-variant/60 shrink-0">
              <span class="material-symbols-outlined">
                account_balance
              </span>
            </div>

            <div class="flex flex-col min-w-0">
              <span class="text-headline-sm font-headline-sm tracking-tight text-on-surface truncate leading-tight">
                MPLADS Portal
              </span>

              <span class="text-label-sm font-label-sm text-on-surface-variant truncate">
                District Authority Oversight
              </span>
            </div>
          </div>

          <nav aria-label="Portal Modules" class="p-3 space-y-1">

            <a
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors text-label-md"
              href="/district/overview"
            >
              <span class="material-symbols-outlined">
                dashboard
              </span>
              <span>District Overview</span>
            </a>

            <a
              aria-current="page"
              class="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-on-primary font-headline-sm text-label-md transition-all shadow-sm"
              href="/district/projects/${escapeHtml(project.id)}"
            >
              <span class="material-symbols-outlined text-on-primary">
                fact_check
              </span>
              <span class="font-medium">
                Project Verification
              </span>
            </a>

            <a
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors text-label-md"
              href="/district/duplicates"
            >
              <span class="material-symbols-outlined">
                content_copy
              </span>
              <span>Duplicate Detection</span>
            </a>

            <a
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors text-label-md"
              href="/district/cost-anomalies"
            >
              <span class="material-symbols-outlined">
                monitoring
              </span>
              <span>Cost Anomalies</span>
            </a>

            <a
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors text-label-md"
              href="/district/audit-logs"
            >
              <span class="material-symbols-outlined">
                history_edu
              </span>
              <span>Audit Logs</span>
            </a>

          </nav>
        </div>

        <div class="p-3 border-t border-outline-variant/30 space-y-1">

          <a
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors text-label-md"
            href="#settings"
          >
            <span class="material-symbols-outlined">
              settings
            </span>
            <span>Settings</span>
          </a>

          <a
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors text-label-md"
            href="#support"
          >
            <span class="material-symbols-outlined">
              help_outline
            </span>
            <span>Support</span>
          </a>

          <div class="mt-2 pt-2 border-t border-outline-variant/20 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-container-low/60">
            <div class="relative w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-primary text-xs font-semibold shrink-0">
              DA
              <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-secondary ring-1 ring-surface-container-lowest"></span>
            </div>

            <div class="flex flex-col min-w-0">
              <span class="text-label-md text-on-surface truncate leading-tight">
                District Authority
              </span>

              <span class="text-label-sm text-on-surface-variant truncate">
                Oversight Workspace
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- TOP BAR -->
        <header class="h-14 bg-surface-container-lowest border-b border-outline-variant/50 flex items-center justify-between px-6 shrink-0 z-10">

          <div class="flex items-center gap-3 w-80">
            <div class="relative w-full">
              <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>

              <input
                class="w-full h-8 pl-8 pr-3 text-body-sm bg-surface-container-low/50 border border-outline-variant/60 rounded-lg text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary"
                placeholder="Search reference code, ward, or block..."
                type="text"
              />
            </div>
          </div>

          <div class="flex items-center gap-4">

            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low rounded-lg border border-outline-variant/40">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span class="text-label-sm text-on-surface">
                District Authority
              </span>
            </div>

            <div class="h-4 w-px bg-outline-variant/50"></div>

            <div class="flex items-center gap-1">
              <button
                aria-label="Notifications"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                type="button"
              >
                <span class="material-symbols-outlined">
                  notifications
                </span>
              </button>

              <button
                aria-label="Help"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                type="button"
              >
                <span class="material-symbols-outlined">
                  help
                </span>
              </button>
            </div>

          </div>
        </header>

        <!-- BREADCRUMB -->
        <div class="h-10 bg-surface border-b border-outline-variant/40 px-6 flex items-center justify-between shrink-0">

          <nav
            aria-label="Breadcrumb"
            class="flex items-center gap-1.5 text-label-sm text-on-surface-variant"
          >
            <span>MPLADS</span>
            <span class="text-outline-variant">/</span>
            <span>District Oversight</span>
            <span class="text-outline-variant">/</span>
            <span>Projects</span>
            <span class="text-outline-variant">/</span>
            <span class="text-on-surface font-semibold">
              ${workId}
            </span>
          </nav>

          <a
            class="inline-flex items-center gap-1 text-label-sm text-on-surface-variant hover:text-on-surface"
            href="/district/overview"
          >
            <span class="material-symbols-outlined text-[14px]">
              arrow_back
            </span>

            <span>Back to District Overview</span>
          </a>
        </div>

        <!-- SCROLLABLE CONTENT -->
        <main class="flex-1 overflow-y-auto px-6 py-6">

          <div class="max-w-6xl mx-auto space-y-5">

            <!-- PROJECT IDENTITY -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-label-sm text-on-surface-variant">
                    Project File
                  </span>

                  <span class="text-outline-variant">•</span>

                  <span class="text-label-sm text-on-surface-variant font-medium font-mono">
                    ${workId}
                  </span>
                </div>

                <h1 class="text-headline-lg text-on-surface tracking-tight break-words">
                  ${activityName}
                </h1>
              </div>

              <div class="flex flex-col items-start md:items-end shrink-0">

                ${renderRiskBadge(project)}

                <div class="text-label-sm text-on-surface-variant mt-1">
                  Risk index:
                  <span class="font-semibold text-on-surface tabular-nums">
                    ${escapeHtml(riskIndex)}
                  </span>
                </div>

                <div class="text-label-sm text-on-surface-variant">
                  Lifecycle:
                  <span class="font-semibold text-on-surface">
                    ${lifecycleStatus}
                  </span>
                </div>
              </div>
            </section>

            <!-- PROJECT META -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 px-5 py-4">

              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/30">

                <div class="space-y-0.5">
                  <p class="text-label-sm text-on-surface-variant">
                    Location
                  </p>
                  <p class="text-body-sm font-medium text-on-surface">
                    ${location}
                  </p>
                </div>

                <div class="space-y-0.5 pt-2 sm:pt-0 lg:pl-4">
                  <p class="text-label-sm text-on-surface-variant">
                    Category
                  </p>
                  <p class="text-body-sm font-medium text-on-surface">
                    ${category}
                  </p>
                </div>

                <div class="space-y-0.5 pt-2 sm:pt-0 lg:pl-4">
                  <p class="text-label-sm text-on-surface-variant">
                    Sanctioned Amount
                  </p>
                  <p class="text-body-sm font-semibold text-on-surface">
                    ${sanctionedAmount}
                  </p>
                </div>

                <div class="space-y-0.5 pt-2 lg:pt-0 lg:pl-4">
                  <p class="text-label-sm text-on-surface-variant">
                    Sanction Date
                  </p>
                  <p class="text-body-sm font-medium text-on-surface">
                    ${sanctionDate}
                  </p>
                </div>

                <div class="space-y-0.5 pt-2 lg:pt-0 lg:pl-4">
                  <p class="text-label-sm text-on-surface-variant">
                    Implementing Agency
                  </p>
                  <p class="text-body-sm font-medium text-on-surface">
                    ${implementingAgency}
                  </p>
                </div>

                <div class="space-y-0.5 pt-2 lg:pt-0 lg:pl-4">
                  <p class="text-label-sm text-on-surface-variant">
                    State
                  </p>
                  <p class="text-body-sm font-medium text-on-surface">
                    ${stateName}
                  </p>
                </div>

              </div>
            </section>

            <!-- RISK ASSESSMENT -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5 space-y-4">

              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 class="text-headline-sm text-on-surface font-semibold">
                    Risk Assessment
                  </h2>

                  <p class="text-body-sm text-on-surface-variant mt-0.5">
                    Backend-generated composite assessment for this project.
                  </p>
                </div>

                <div class="text-right">
                  <div class="text-label-sm text-on-surface-variant">
                    Composite Risk Index
                  </div>

                  <div class="text-3xl font-bold text-on-surface tabular-nums">
                    ${escapeHtml(riskIndex)}
                  </div>

                  <div class="text-label-sm text-on-surface-variant">
                    ${escapeHtml(riskLabel)}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

                <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Cost Score
                  </div>

                  <div class="mt-1 text-xl font-semibold text-on-surface tabular-nums">
                    ${escapeHtml(
                      project?.riskAssessment
                        ?.primaryAnchors?.costScore ?? 0
                    )}
                  </div>
                </div>

                <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Duplicate Score
                  </div>

                  <div class="mt-1 text-xl font-semibold text-on-surface tabular-nums">
                    ${escapeHtml(
                      project?.riskAssessment
                        ?.primaryAnchors?.duplicateScore ?? 0
                    )}
                  </div>
                </div>

                <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Consistency Score
                  </div>

                  <div class="mt-1 text-xl font-semibold text-on-surface tabular-nums">
                    ${escapeHtml(
                      project?.riskAssessment
                        ?.primaryAnchors?.consistencyScore ?? 0
                    )}
                  </div>
                </div>

              </div>

              <div>
                <h3 class="text-label-sm uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Why this project was flagged
                </h3>

                ${
                  reasons.length
                    ? `
                      <ul class="space-y-2">
                        ${reasons
                          .map(
                            (reason) => `
                              <li class="flex items-start gap-2 text-body-sm text-on-surface">
                                <span class="w-1.5 h-1.5 rounded-full bg-error mt-2 shrink-0"></span>
                                <span>${escapeHtml(reason)}</span>
                              </li>
                            `
                          )
                          .join("")}
                      </ul>
                    `
                    : `
                      <div class="text-body-sm text-on-surface-variant">
                        No explanatory risk reasons were returned.
                      </div>
                    `
                }
              </div>

            </section>

            <!-- PROJECT DESCRIPTION -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5">

              <h2 class="text-headline-sm text-on-surface font-semibold">
                Project Description
              </h2>

              <p class="mt-3 text-body-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                ${description}
              </p>

              <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <div class="text-label-sm text-on-surface-variant">
                    MP
                  </div>
                  <div class="mt-1 text-body-sm font-medium text-on-surface">
                    ${mpName}
                  </div>
                </div>

                <div>
                  <div class="text-label-sm text-on-surface-variant">
                    Constituency
                  </div>
                  <div class="mt-1 text-body-sm font-medium text-on-surface">
                    ${constituency}
                  </div>
                </div>

                <div>
                  <div class="text-label-sm text-on-surface-variant">
                    Recommendation Date
                  </div>
                  <div class="mt-1 text-body-sm font-medium text-on-surface">
                    ${recommendationDate}
                  </div>
                </div>

              </div>
            </section>

            <!-- LIFECYCLE -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5">

              <div>
                <h2 class="text-headline-sm text-on-surface font-semibold">
                  Lifecycle
                </h2>

                <p class="text-body-sm text-on-surface-variant mt-0.5">
                  Recorded project progression through the available eSAKSHI stages.
                </p>
              </div>

              <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div class="p-4 rounded-lg border border-outline-variant bg-surface-container-low">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Recommendation
                  </div>

                  <div class="mt-2 text-body-sm font-semibold text-on-surface">
                    ${recommendationDate}
                  </div>
                </div>

                <div class="p-4 rounded-lg border border-outline-variant bg-surface-container-low">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Sanction
                  </div>

                  <div class="mt-2 text-body-sm font-semibold text-on-surface">
                    ${sanctionDate}
                  </div>
                </div>

                <div class="p-4 rounded-lg border border-outline-variant bg-surface-container-low">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Completion
                  </div>

                  <div class="mt-2 text-body-sm font-semibold text-on-surface">
                    ${completionDate}
                  </div>
                </div>

              </div>

            </section>

            <!-- AMOUNTS -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5">

              <h2 class="text-headline-sm text-on-surface font-semibold">
                Financial Summary
              </h2>

              <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

                <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Recommended
                  </div>

                  <div class="mt-1 text-xl font-semibold text-on-surface tabular-nums">
                    ${recommendedAmount}
                  </div>
                </div>

                <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Sanctioned
                  </div>

                  <div class="mt-1 text-xl font-semibold text-on-surface tabular-nums">
                    ${sanctionedAmount}
                  </div>
                </div>

                <div class="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div class="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Actual
                  </div>

                  <div class="mt-1 text-xl font-semibold text-on-surface tabular-nums">
                    ${actualAmount}
                  </div>
                </div>

              </div>

            </section>

            <!-- RISK SIGNALS -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5">

              <div class="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 class="text-headline-sm text-on-surface font-semibold">
                    Risk Signals
                  </h2>

                  <p class="text-body-sm text-on-surface-variant mt-0.5">
                    Individual signals returned by the backend risk engine.
                  </p>
                </div>

                <div class="flex items-center gap-3 text-label-sm">
                  ${
                    hasDuplicate
                      ? `
                        <span class="inline-flex items-center gap-1.5 text-error">
                          <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Duplicate signal
                        </span>
                      `
                      : ""
                  }

                  ${
                    hasCost
                      ? `
                        <span class="inline-flex items-center gap-1.5 text-on-surface">
                          <span class="w-1.5 h-1.5 rounded-full bg-outline"></span>
                          Cost signal
                        </span>
                      `
                      : ""
                  }
                </div>
              </div>

              <div class="mt-4 space-y-3">
                ${renderSignalRows(project)}
              </div>

            </section>

            <!-- DUPLICATE CANDIDATES -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5">

              <div class="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 class="text-headline-sm text-on-surface font-semibold">
                    Duplicate / Overlap Candidates
                  </h2>

                  <p class="text-body-sm text-on-surface-variant mt-0.5">
                    Related works returned by the duplicate-detection stage.
                  </p>
                </div>

                <a
                  href="/district/duplicates"
                  class="text-label-md font-medium text-primary hover:underline"
                >
                  Open Duplicate Detection →
                </a>
              </div>

              <div class="mt-4 space-y-3">
                ${renderDuplicateCandidates(project)}
              </div>

            </section>

            <!-- EXPENDITURES -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5">

              <div>
                <h2 class="text-headline-sm text-on-surface font-semibold">
                  Expenditure Records
                </h2>

                <p class="text-body-sm text-on-surface-variant mt-0.5">
                  Expenditure entries returned for this project.
                </p>
              </div>

              <div class="mt-4">
                ${renderExpenditures(project)}
              </div>

            </section>

            <!-- REVIEW SUMMARY -->
            <section class="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

              <div class="flex flex-wrap items-center gap-5">

                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${hasDuplicate ? "bg-error" : "bg-secondary"}"></span>

                  <span class="text-label-sm font-semibold text-on-surface">
                    Duplicate signal:
                  </span>

                  <span class="text-label-sm text-on-surface-variant">
                    ${hasDuplicate ? "Detected" : "None detected"}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${hasCost ? "bg-error" : "bg-secondary"}"></span>

                  <span class="text-label-sm font-semibold text-on-surface">
                    Cost anomaly:
                  </span>

                  <span class="text-label-sm text-on-surface-variant">
                    ${hasCost ? "Detected" : "None detected"}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-outline"></span>

                  <span class="text-label-sm font-semibold text-on-surface">
                    Lifecycle:
                  </span>

                  <span class="text-label-sm text-on-surface-variant">
                    ${lifecycleStatus}
                  </span>
                </div>

              </div>

              <a
                href="/district/overview"
                class="inline-flex items-center gap-1.5 text-label-sm font-medium text-on-surface hover:text-primary shrink-0"
              >
                <span class="material-symbols-outlined text-[15px]">
                  arrow_back
                </span>

                <span>Back to District Overview</span>
              </a>

            </section>

            <footer class="pt-4 pb-8 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between text-label-sm text-on-surface-variant gap-2">
              <span>
                National Informatics Centre · Ministry of Statistics and Programme Implementation
              </span>

              <span>
                Government of India Oversight Framework
              </span>
            </footer>

          </div>
        </main>
      </div>
    </div>
  `;
}

export default function DistrictProjectDetail() {
  useStitchNavigation();

  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (!id) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getProject(id);

        if (cancelled) return;

        setProject(response?.data ?? null);

        if (!response?.data) {
          setError("Project was not found.");
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load project:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load project."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-on-surface-variant">
        Loading project…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-lg w-full border border-outline-variant rounded-lg bg-surface-container-lowest p-6">

          <h1 className="text-lg font-semibold text-on-surface">
            Unable to load project
          </h1>

          <p className="mt-2 text-sm text-error">
            {error || "Project was not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/district/overview")
            }
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            ← Back to District Overview
          </button>

        </div>
      </div>
    );
  }

  return (
    <div
      className="stitch-page-root"
      dangerouslySetInnerHTML={{
        __html: renderMarkup(project),
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