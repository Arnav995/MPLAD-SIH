import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStitchNavigation } from "../navigation";
import { getDuplicateCandidates } from "../api/district";

const markup = (data) => `
  <!-- SIDEBAR -->
  <aside class="fixed top-0 left-0 h-screen w-64 flex flex-col justify-between bg-surface-container-lowest border-r border-outline-variant z-30 shrink-0">
    <div>
      <div class="p-4 border-b border-surface-container">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded border border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-primary text-xl">account_balance</span>
          </div>
          <div class="flex flex-col">
            <span class="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight leading-tight">
              MPLADS Portal
            </span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">
              District Authority Oversight
            </span>
          </div>
        </div>
      </div>

      <nav class="p-3 space-y-1">
        <a href="#" data-nav="/district/overview"
          class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 rounded text-label-md font-label-md">
          <span class="material-symbols-outlined text-lg">dashboard</span>
          <span>District Overview</span>
        </a>

        <a href="#" data-nav="/district/projects"
          class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 rounded text-label-md font-label-md">
          <span class="material-symbols-outlined text-lg">fact_check</span>
          <span>Project Verification</span>
        </a>

        <a href="#"
          class="flex items-center gap-3 px-3 py-2 bg-primary text-on-primary rounded font-label-md text-label-md shadow-sm">
          <span class="material-symbols-outlined text-lg symbol-fill">content_copy</span>
          <span>Duplicate Detection</span>
        </a>

        <a href="#" data-nav="/district/cost-anomalies"
          class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 rounded text-label-md font-label-md">
          <span class="material-symbols-outlined text-lg">monitoring</span>
          <span>Cost Anomalies</span>
        </a>

        <a href="#" data-nav="/district/audit-logs"
          class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 rounded text-label-md font-label-md">
          <span class="material-symbols-outlined text-lg">history_edu</span>
          <span>Audit Logs</span>
        </a>
      </nav>
    </div>

    <div class="mt-auto px-4 pb-4 pt-3 border-t border-outline-variant flex flex-col gap-1">
      <nav class="space-y-1">
        <a href="#"
          class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors text-label-md font-label-md">
          <span class="material-symbols-outlined text-lg">settings</span>
          <span>Settings</span>
        </a>

        <a href="#"
          class="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors text-label-md font-label-md">
          <span class="material-symbols-outlined text-lg">help_outline</span>
          <span>Support</span>
        </a>
      </nav>

      <div class="mt-3 pt-3 border-t border-surface-container flex items-center gap-3 px-1">
        <div class="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center font-label-md font-bold text-xs shrink-0 tracking-wider">
          DM
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-semibold text-on-surface truncate">
            District Magistrate
          </span>
          <span class="text-xs text-on-surface-variant truncate">
            District Authority
          </span>
        </div>
      </div>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="flex-1 ml-64 flex flex-col min-h-screen">

    <header class="docked full-width top-0 h-14 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-8 sticky z-20">
      <div class="relative w-80">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
          search
        </span>
        <input
          data-search
          class="w-full h-8 pl-9 pr-3 bg-surface-container-lowest border border-outline-variant font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 focus:outline-none transition-colors rounded-lg"
          placeholder="Search duplicate cases..."
          type="text"
        >
      </div>

      <div class="flex items-center gap-4">
        <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded">
          <span class="w-2 h-2 rounded-full bg-[#06C167]"></span>
          <span class="font-label-sm text-label-sm font-semibold text-on-surface">
            District Authority
          </span>
        </div>

        <button class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
          <span class="material-symbols-outlined text-lg">notifications</span>
        </button>

        <button class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
          <span class="material-symbols-outlined text-lg">help</span>
        </button>
      </div>
    </header>

    <main class="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">

      <!-- PAGE HEADER -->
      <div>
        <nav class="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant mb-1">
          <span>MPLADS</span>
          <span class="material-symbols-outlined text-xs">chevron_right</span>
          <span>District Oversight</span>
          <span class="material-symbols-outlined text-xs">chevron_right</span>
          <span class="text-on-surface">Duplicate Detection</span>
        </nav>

        <div class="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
          <div>
            <h1 class="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
              Duplicate Detection
            </h1>
            <p class="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Review projects identified as potential duplicate or overlapping works.
            </p>
          </div>
        </div>
      </div>

      <!-- SUMMARY -->
      <section class="bg-surface-container-lowest border border-outline-variant divide-y sm:divide-y-0 sm:divide-x divide-outline-variant grid grid-cols-2 sm:grid-cols-4 rounded-xl">

        <div class="px-5 py-3.5 flex flex-col">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Potential Duplicates
          </span>
          <span class="font-numeric-metric text-numeric-metric font-semibold text-on-surface mt-0.5 tabular-nums">
            ${data.potentialDuplicates}
          </span>
        </div>

        <div class="px-5 py-3.5 flex flex-col">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Projects Involved
          </span>
          <span class="font-numeric-metric text-numeric-metric font-semibold text-on-surface mt-0.5 tabular-nums">
            ${data.projectsInvolved}
          </span>
        </div>

        <div class="px-5 py-3.5 flex flex-col">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            High Suspicion
          </span>
          <span class="font-numeric-metric text-numeric-metric font-semibold text-[#dc2626] mt-0.5 tabular-nums">
            ${data.highSuspicion}
          </span>
        </div>

        <div class="px-5 py-3.5 flex flex-col">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Pending Review
          </span>
          <span class="font-numeric-metric text-numeric-metric font-semibold text-on-surface mt-0.5 tabular-nums">
            ${data.pendingReview}
          </span>
        </div>

      </section>

      <!-- FILTER BAR -->
      <section class="bg-surface-container-lowest border border-outline-variant p-3 flex flex-wrap items-center justify-between gap-3 rounded-xl">

        <div class="relative flex-1 min-w-[240px]">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>

          <input
            data-case-search
            class="w-full h-9 pl-9 pr-3 bg-surface-container-lowest border border-outline-variant font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 focus:outline-none rounded-lg"
            placeholder="Search by work ID or district..."
            type="text"
          >
        </div>

        <div class="flex items-center flex-wrap gap-2.5">

          <div class="inline-flex items-center p-0.5 bg-surface-container-low border border-outline-variant h-9 rounded-lg">
            <span class="px-2.5 py-1 text-xs font-medium text-on-surface-variant">
              Suspicion:
            </span>

            <button data-threshold="0.85"
              class="px-2.5 py-1 text-xs font-semibold bg-surface-container-lowest text-on-surface border border-outline-variant shadow-xs rounded">
              All
            </button>

            <button data-threshold="0.9"
              class="px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:text-on-surface">
              High
            </button>

            <button data-threshold="0.85"
              class="px-2.5 py-1 text-xs font-medium text-on-surface-variant hover:text-on-surface">
              Medium+
            </button>
          </div>

        </div>
      </section>

      <!-- CASES -->
      <section data-cases class="space-y-4">
        ${data.casesMarkup}
      </section>

      <!-- EMPTY -->
      <section data-empty class="hidden bg-surface-container-lowest border border-outline-variant rounded-xl p-10 text-center">
        <span class="material-symbols-outlined text-4xl text-on-surface-variant">
          search_off
        </span>
        <h3 class="mt-3 text-lg font-semibold text-on-surface">
          No duplicate candidates found
        </h3>
        <p class="mt-1 text-sm text-on-surface-variant">
          No candidates match the current search or suspicion threshold.
        </p>
      </section>

    </main>

    <footer class="mt-auto border-t border-outline-variant bg-surface-container-lowest px-8 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-center text-xs text-on-surface-variant font-label-sm py-1">
        <span>
          National Informatics Centre · Ministry of Statistics and Programme Implementation
        </span>
      </div>
    </footer>

  </div>
`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `${(number * 100).toFixed(1)}%`;
}

function formatRatio(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return `${number.toFixed(2)}×`;
}

function getPriority(score) {
  const value = Number(score);

  if (value >= 0.9) return "HIGH";

  return "MEDIUM";
}

function renderCase(item, index) {
  const workA = escapeHtml(item.work_id_a);
  const workB = escapeHtml(item.work_id_b);
  const district = escapeHtml(item.district || "Unknown district");
  const similarity = formatPercent(item.text_similarity);
  const suspicion = Number(item.duplicate_suspicion_score);
  const suspicionText = formatPercent(item.duplicate_suspicion_score);
  const daysApart = Number(item.days_apart);
  const sameVendor = item.same_vendor === true;
  const amountRatio = formatRatio(item.amount_ratio);
  const reason = escapeHtml(item.reason || "Duplicate candidate requires human review.");
  const priority = getPriority(item.duplicate_suspicion_score);

  const priorityClass =
    priority === "HIGH"
      ? "text-[#dc2626] bg-[#FEF2F2] border-[#FECACA]"
      : "text-[#92400e] bg-[#FFFBEB] border-[#FDE68A]";

  return `
    <article
      data-case
      data-search-text="${escapeHtml(
        `${item.work_id_a} ${item.work_id_b} ${item.district} ${item.reason}`
      )}"
      data-suspicion="${Number.isFinite(suspicion) ? suspicion : 0}"
      class="bg-surface-container-lowest border border-outline-variant overflow-hidden shadow-xs rounded-xl"
    >

      <div class="px-6 py-4 border-b border-surface-container-low flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs font-semibold tracking-wider uppercase px-2.5 py-1 bg-surface-container-low border border-outline-variant text-on-surface rounded">
            DUPLICATE CANDIDATE
          </span>

          <span class="text-xs font-mono text-on-surface-variant">
            CASE-${String(index + 1).padStart(4, "0")}
          </span>
        </div>

        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium ${priorityClass} border rounded">
          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
          <span>${priority === "HIGH" ? "High Suspicion" : "Medium Suspicion"}</span>
        </div>
      </div>

      <div class="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- WORK A -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
          <span class="font-mono text-xs font-semibold tracking-wide uppercase text-on-surface-variant block mb-2">
            WORK A
          </span>

          <h3 class="text-lg font-bold text-on-surface leading-snug mb-1">
            Work ${workA}
          </h3>

          <span class="font-mono text-xs text-on-surface-variant block mb-5">
            Reference ID: ${workA}
          </span>

          <div class="pt-3 border-t border-surface-container space-y-2.5">
            <div class="flex justify-between gap-4 text-xs">
              <span class="text-on-surface-variant">District</span>
              <span class="text-on-surface font-medium text-right">${district}</span>
            </div>

            <div class="flex justify-between gap-4 text-xs">
              <span class="text-on-surface-variant">Text Similarity</span>
              <span class="text-on-surface font-semibold">${similarity}</span>
            </div>

            <div class="pt-2">
              <a
                href="#"
                data-project-id="${workA}"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-on-surface-variant"
              >
                View project
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        <!-- WORK B -->
        <div class="bg-[#FEF2F2]/40 border border-[#FECACA]/60 rounded-lg p-6">
          <span class="inline-block font-mono text-xs font-semibold tracking-wider uppercase text-[#dc2626] bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded mb-2">
            WORK B
          </span>

          <h3 class="text-lg font-bold text-on-surface leading-snug mb-1">
            Work ${workB}
          </h3>

          <span class="font-mono text-xs text-on-surface-variant block mb-5">
            Reference ID: ${workB}
          </span>

          <div class="pt-3 border-t border-[#FECACA]/60 space-y-2.5">
            <div class="flex justify-between gap-4 text-xs">
              <span class="text-on-surface-variant">District</span>
              <span class="text-on-surface font-medium text-right">${district}</span>
            </div>

            <div class="flex justify-between gap-4 text-xs">
              <span class="text-on-surface-variant">Text Similarity</span>
              <span class="text-on-surface font-semibold">${similarity}</span>
            </div>

            <div class="pt-2">
              <a
                href="#"
                data-project-id="${workB}"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-on-surface-variant"
              >
                View project
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      <!-- EVIDENCE -->
      <div class="px-7 py-4 bg-surface-container-low border-t border-surface-container">

        <div class="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
          WHY THEY APPEAR RELATED
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">

          <div>
            <div class="text-xs text-on-surface-variant mb-1">
              Suspicion Score
            </div>
            <div class="font-semibold text-on-surface">
              ${suspicionText}
            </div>
          </div>

          <div>
            <div class="text-xs text-on-surface-variant mb-1">
              Days Apart
            </div>
            <div class="font-semibold text-on-surface">
              ${Number.isFinite(daysApart) ? daysApart : "—"}
            </div>
          </div>

          <div>
            <div class="text-xs text-on-surface-variant mb-1">
              Same Vendor
            </div>
            <div class="font-semibold text-on-surface">
              ${sameVendor ? "Yes" : "No"}
            </div>
          </div>

          <div>
            <div class="text-xs text-on-surface-variant mb-1">
              Amount Ratio
            </div>
            <div class="font-semibold text-on-surface">
              ${amountRatio}
            </div>
          </div>

        </div>

        <div class="mt-4 pt-4 border-t border-outline-variant">
          <div class="text-xs text-on-surface-variant mb-1">
            Detection reason
          </div>

          <p class="text-sm text-on-surface leading-relaxed">
            ${reason}
          </p>
        </div>

      </div>

    </article>
  `;
}

export default function DistrictDuplicates() {
  useStitchNavigation();

  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [threshold, setThreshold] = useState(0.85);

  useEffect(() => {
    let cancelled = false;

    async function loadDuplicates() {
      try {
        setLoading(true);
        setError("");

        const response = await getDuplicateCandidates({
          min_suspicion_score: threshold,
        });

        if (cancelled) return;

        setCases(response?.results ?? []);
      } catch (err) {
        if (cancelled) return;

        setError(err?.message || "Failed to load duplicate candidates.");
        setCases([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDuplicates();

    return () => {
      cancelled = true;
    };
  }, [threshold]);

  const filteredCases = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return cases;

    return cases.filter((item) => {
      const haystack = [
        item.work_id_a,
        item.work_id_b,
        item.district,
        item.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [cases, search]);

  const stats = useMemo(() => {
    const projects = new Set();

    cases.forEach((item) => {
      if (item.work_id_a) projects.add(String(item.work_id_a));
      if (item.work_id_b) projects.add(String(item.work_id_b));
    });

    return {
      potentialDuplicates: cases.length,
      projectsInvolved: projects.size,
      highSuspicion: cases.filter(
        (item) => Number(item.duplicate_suspicion_score) >= 0.9
      ).length,
      pendingReview: cases.length,
    };
  }, [cases]);

  useEffect(() => {
    const root = document.querySelector(".stitch-page-root");

    if (!root) return;

    const searchInputs = root.querySelectorAll(
      "[data-search], [data-case-search]"
    );

    searchInputs.forEach((input) => {
      input.value = search;
    });

    const searchHandler = (event) => {
      setSearch(event.target.value);
    };

    searchInputs.forEach((input) => {
      input.addEventListener("input", searchHandler);
    });

    const thresholdButtons = root.querySelectorAll("[data-threshold]");

    const thresholdHandler = (event) => {
      const nextThreshold = Number(event.currentTarget.dataset.threshold);

      if (Number.isFinite(nextThreshold)) {
        setThreshold(nextThreshold);
      }
    };

    thresholdButtons.forEach((button) => {
      button.addEventListener("click", thresholdHandler);
    });

    const projectLinks = root.querySelectorAll("[data-project-id]");

    const projectHandler = (event) => {
      event.preventDefault();

      const projectId = event.currentTarget.dataset.projectId;

      if (projectId) {
        navigate(`/district/projects/${projectId}`);
      }
    };

    projectLinks.forEach((link) => {
      link.addEventListener("click", projectHandler);
    });

    const navLinks = root.querySelectorAll("[data-nav]");

    const navHandler = (event) => {
      event.preventDefault();

      const path = event.currentTarget.dataset.nav;

      if (path) {
        navigate(path);
      }
    };

    navLinks.forEach((link) => {
      link.addEventListener("click", navHandler);
    });

    return () => {
      searchInputs.forEach((input) => {
        input.removeEventListener("input", searchHandler);
      });

      thresholdButtons.forEach((button) => {
        button.removeEventListener("click", thresholdHandler);
      });

      projectLinks.forEach((link) => {
        link.removeEventListener("click", projectHandler);
      });

      navLinks.forEach((link) => {
        link.removeEventListener("click", navHandler);
      });
    };
  }, [search, navigate, filteredCases]);

  const casesMarkup = loading
    ? `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-10 text-center">
        <span class="material-symbols-outlined text-4xl text-on-surface-variant animate-spin">
          progress_activity
        </span>
        <p class="mt-3 text-sm text-on-surface-variant">
          Loading duplicate candidates...
        </p>
      </div>
    `
    : error
      ? `
        <div class="bg-surface-container-lowest border border-[#FECACA] rounded-xl p-10 text-center">
          <span class="material-symbols-outlined text-4xl text-[#dc2626]">
            error_outline
          </span>
          <h3 class="mt-3 text-lg font-semibold text-on-surface">
            Failed to load duplicate candidates
          </h3>
          <p class="mt-1 text-sm text-on-surface-variant">
            ${escapeHtml(error)}
          </p>
        </div>
      `
      : filteredCases.length === 0
        ? ""
        : filteredCases
            .map((item, index) => renderCase(item, index))
            .join("");

  return (
    <div
      className="stitch-page-root"
      dangerouslySetInnerHTML={{
        __html: markup({
          ...stats,
          casesMarkup,
        }),
      }}
    />
  );
}