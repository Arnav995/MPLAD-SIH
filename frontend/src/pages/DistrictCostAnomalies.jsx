import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { getProjects } from "../api/district";
import { formatCurrency } from "../api/helpers";

const PAGE_SIZE = 10;
const FETCH_PAGE_SIZE = 5000;

function normalizeProject(project) {
  const riskAssessment =
    project?.riskAssessment ??
    project?.risk_assessment ??
    {};

  const anchors =
    riskAssessment?.primaryAnchors ??
    riskAssessment?.primary_anchors ??
    {};

  const signals = Array.isArray(
    project?.riskSignals
  )
    ? project.riskSignals
    : Array.isArray(
        project?.risk_signals
      )
    ? project.risk_signals
    : [];

  return {
    ...project,

    id:
      project?.id ??
      project?.workId ??
      project?.work_id ??
      null,

    workId:
      project?.workId ??
      project?.work_id ??
      project?.id ??
      null,

    activityName:
      project?.activityName ??
      project?.activity_name ??
      "",

    description:
      project?.description ??
      project?.work_description ??
      project?.workDescription ??
      "",

    category:
      project?.category ??
      project?.work_category ??
      "",

    sanctionAmount:
      project?.sanctionAmount ??
      project?.sanction_amount ??
      null,

    constituencyNameFromSource:
      project?.constituencyNameFromSource ??
      project?.constituency_name_from_source ??
      project?.constituency ??
      "",

    riskAssessment: {
      ...riskAssessment,

      riskIndex:
        riskAssessment?.riskIndex ??
        riskAssessment?.risk_index ??
        project?.riskIndex ??
        project?.risk_index ??
        0,

      tier:
        riskAssessment?.tier ??
        project?.tier ??
        "CLEAN",

      primaryAnchors: anchors,
    },

    riskSignals: signals,
  };
}

function getCostSignals(project) {
  return project?.riskSignals?.filter(
    (signal) =>
      String(
        signal?.type ??
          signal?.signal_type ??
          ""
      ).toUpperCase() ===
      "COST_ANOMALY"
  ) ?? [];
}

function getCostSignal(project) {
  const signals =
    getCostSignals(project);

  if (signals.length === 0) {
    return null;
  }

  return signals.reduce(
    (best, current) => {
      const bestScore = Number(
        best?.score ?? 0
      );

      const currentScore = Number(
        current?.score ?? 0
      );

      return currentScore > bestScore
        ? current
        : best;
    },
    signals[0]
  );
}

function getCostScore(project) {
  const signal =
    getCostSignal(project);

  if (signal) {
    const score = Number(
      signal?.score ?? 0
    );

    if (Number.isFinite(score)) {
      return score;
    }
  }

  const score = Number(
    project?.riskAssessment
      ?.primaryAnchors?.costScore ??
      project?.riskAssessment
        ?.primaryAnchors?.cost_score ??
      0
  );

  return Number.isFinite(score)
    ? score
    : 0;
}

function getSeverity(project) {
  const signal =
    getCostSignal(project);

  if (!signal) {
    return null;
  }

  const severity = String(
    signal?.severity ??
      signal?.signal_severity ??
      ""
  ).toUpperCase();

  return severity || null;
}

function getRiskIndex(project) {
  const value = Number(
    project?.riskAssessment
      ?.riskIndex ?? 0
  );

  return Number.isFinite(value)
    ? value
    : 0;
}

function getRiskLabel(project) {
  const tier = String(
    project?.riskAssessment?.tier ??
      "CLEAN"
  ).toUpperCase();

  if (
    tier === "TIER_2" ||
    tier === "TIER-2" ||
    tier === "TIER2"
  ) {
    return "High";
  }

  if (
    tier === "TIER_1" ||
    tier === "TIER-1" ||
    tier === "TIER1"
  ) {
    return "Medium";
  }

  return "Low";
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

function getProjectReference(project) {
  return (
    project?.workId ??
    project?.id ??
    "—"
  );
}

function getSeverityClass(severity) {
  switch (
    String(severity ?? "").toUpperCase()
  ) {
    case "HIGH":
    case "CRITICAL":
      return "text-error";

    case "MEDIUM":
      return "text-warning";

    case "LOW":
      return "text-on-surface";

    default:
      return "text-on-surface-variant";
  }
}

export default function DistrictCostAnomalies() {
  const navigate = useNavigate();

  const [projects, setProjects] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [severityFilter, setSeverityFilter] =
    useState("all");

  const [page, setPage] =
    useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setError("");

      try {
        const response =
          await getProjects({
            page: 1,
            page_size:
              FETCH_PAGE_SIZE,
            sort: "risk_desc",
          });

        if (cancelled) {
          return;
        }

        const rows =
          Array.isArray(
            response?.projects
          )
            ? response.projects
            : [];

        const normalized =
          rows.map(
            normalizeProject
          );

        /*
         * A cost anomaly is represented either by
         * an explicit COST_ANOMALY risk signal or
         * by a positive persisted costScore anchor.
         *
         * We use both so the page remains compatible
         * with the rolled-back backend response.
         */
        const costProjects =
          normalized.filter(
            (project) => {
              const hasSignal =
                getCostSignals(
                  project
                ).length > 0;

              const costScore =
                getCostScore(project);

              return (
                hasSignal ||
                costScore > 0
              );
            }
          );

        setProjects(
          costProjects
        );
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setProjects([]);

        setError(
          requestError?.message ||
            "Unable to load cost anomaly projects."
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
  }, []);

  const filteredProjects =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {
          const severity =
            getSeverity(project);

          if (
            severityFilter !==
              "all" &&
            severity !==
              severityFilter.toUpperCase()
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchable = [
            project?.activityName,
            project?.description,
            project?.workId,
            project?.category,
            project?.constituencyNameFromSource,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      projects,
      search,
      severityFilter,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredProjects.length /
          PAGE_SIZE
      )
    );

  const visibleProjects =
    filteredProjects.slice(
      (page - 1) *
        PAGE_SIZE,
      page * PAGE_SIZE
    );

  const highSeverityCount =
    projects.filter(
      (project) => {
        const severity =
          getSeverity(project);

        return (
          severity === "HIGH" ||
          severity === "CRITICAL"
        );
      }
    ).length;

  const highestScore =
    projects.reduce(
      (highest, project) =>
        Math.max(
          highest,
          getCostScore(project)
        ),
      0
    );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [
    page,
    totalPages,
  ]);

  function handleSearch(event) {
    setSearch(
      event.target.value
    );
    setPage(1);
  }

  function handleSeverity(event) {
    setSeverityFilter(
      event.target.value
    );
    setPage(1);
  }

  function handleView(project) {
    const workId =
      project?.workId ??
      project?.id;

    if (!workId) {
      return;
    }

    navigate(
      `/district/projects/${workId}`
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface">

      <header className="h-16 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-6">

        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
            MS
          </div>

          <div>
            <div className="font-bold text-body-md">
              MPLADS Sentinel
            </div>

            <div className="text-[11px] text-on-surface-variant">
              District Oversight
            </div>
          </div>

        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-surface-container-low"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-surface-container-low"
            title="Help"
          >
            <span className="material-symbols-outlined text-[20px]">
              help
            </span>
          </button>

        </div>

      </header>

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">

        <div className="flex flex-col gap-1">

          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-label-md text-on-surface-variant"
          >
            <span>MPLADS</span>

            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>

            <span>
              District Oversight
            </span>

            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>

            <span className="text-on-surface font-semibold">
              Cost Anomalies
            </span>

          </nav>

          <h1 className="text-headline-lg font-bold tracking-tight">
            Cost Anomalies
          </h1>

          <p className="text-body-sm text-on-surface-variant">
            Review projects with detected cost anomaly signals.
          </p>

        </div>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">

          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-outline-variant">

            <div className="flex flex-col py-2 md:py-0 md:px-5 first:pl-0">

              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                COST ANOMALY PROJECTS
              </span>

              <span className="text-numeric-metric tabular-nums text-on-surface mt-1.5">
                {loading
                  ? "—"
                  : projects.length}
              </span>

            </div>

            <div className="flex flex-col py-2 md:py-0 md:px-5">

              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                HIGH SEVERITY
              </span>

              <span className="text-numeric-metric tabular-nums text-error mt-1.5">
                {loading
                  ? "—"
                  : highSeverityCount}
              </span>

            </div>

            <div className="flex flex-col py-2 md:py-0 md:px-5">

              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                PROJECTS ON THIS PAGE
              </span>

              <span className="text-numeric-metric tabular-nums mt-1.5">
                {loading
                  ? "—"
                  : visibleProjects.length}
              </span>

            </div>

            <div className="flex flex-col py-2 md:py-0 md:px-5 last:pr-0">

              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                HIGHEST SIGNAL SCORE
              </span>

              <span className="text-numeric-metric tabular-nums text-error mt-1.5">
                {loading
                  ? "—"
                  : highestScore || "—"}
              </span>

            </div>

          </div>

        </section>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">

          <div className="relative w-72">

            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>

            <input
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-primary"
              placeholder="Search projects..."
              type="search"
              value={search}
              onChange={handleSearch}
            />

          </div>

          <div className="flex items-center gap-2">

            <label
              className="text-label-sm text-on-surface-variant uppercase"
              htmlFor="cost-anomaly-severity"
            >
              Severity:
            </label>

            <select
              id="cost-anomaly-severity"
              className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm focus:outline-none focus:border-primary"
              value={severityFilter}
              onChange={handleSeverity}
            >

              <option value="all">
                All
              </option>

              <option value="high">
                High
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="low">
                Low
              </option>

            </select>

          </div>

        </section>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">

          {loading ? (
            <div className="p-10 text-center">

              <div className="font-semibold">
                Loading cost anomalies…
              </div>

              <div className="text-body-sm text-on-surface-variant mt-1">
                Reading persisted risk data.
              </div>

            </div>
          ) : error ? (
            <div className="p-10 text-center">

              <div className="font-semibold text-error">
                Unable to load cost anomalies
              </div>

              <div className="text-body-sm text-on-surface-variant mt-1">
                {error}
              </div>

            </div>
          ) : visibleProjects.length ===
            0 ? (
            <div className="p-10 text-center">

              <div className="font-semibold">
                No cost anomaly projects found
              </div>

              <div className="text-body-sm text-on-surface-variant mt-1">
                {search.trim()
                  ? "Try changing the search."
                  : "No persisted COST_ANOMALY signals were found."}
              </div>

            </div>
          ) : (
            <>

              <div className="overflow-x-auto">

                <table className="w-full border-collapse text-left">

                  <thead>

                    <tr className="bg-surface-container-low border-b border-outline-variant">

                      <th className="py-2 px-4 text-label-sm text-on-surface-variant uppercase w-[27%]">
                        PROJECT
                      </th>

                      <th className="py-2 px-4 text-label-sm text-on-surface-variant uppercase w-[15%]">
                        CATEGORY
                      </th>

                      <th className="py-2 px-4 text-label-sm text-on-surface-variant uppercase text-right w-[13%]">
                        SANCTION
                      </th>

                      <th className="py-2 px-4 text-label-sm text-on-surface-variant uppercase w-[12%]">
                        RISK
                      </th>

                      <th className="py-2 px-4 text-label-sm text-on-surface-variant uppercase w-[12%]">
                        SEVERITY
                      </th>

                      <th className="py-2 px-4 text-label-sm text-on-surface-variant uppercase w-[14%]">
                        SIGNAL SCORE
                      </th>

                      <th className="py-2 px-4 text-label-sm text-on-surface-variant uppercase text-right w-[7%]">
                        ACTION
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-surface-container">

                    {visibleProjects.map(
                      (project) => {
                        const severity =
                          getSeverity(
                            project
                          );

                        const riskLabel =
                          getRiskLabel(
                            project
                          );

                        const riskIndex =
                          getRiskIndex(
                            project
                          );

                        const score =
                          getCostScore(
                            project
                          );

                        return (
                          <tr
                            key={
                              project?.id ??
                              project?.workId
                            }
                            className="hover:bg-surface-container-low"
                          >

                            <td className="py-3 px-4 align-top">

                              <div className="font-semibold text-body-sm">
                                {getProjectName(
                                  project
                                )}
                              </div>

                              <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                                {getProjectReference(
                                  project
                                )}
                              </div>

                              {project?.constituencyNameFromSource ? (
                                <div className="text-[11px] text-on-surface-variant mt-1">
                                  {
                                    project.constituencyNameFromSource
                                  }
                                </div>
                              ) : null}

                            </td>

                            <td className="py-3 px-4 align-top text-body-sm">
                              {project?.category ||
                                "—"}
                            </td>

                            <td className="py-3 px-4 align-top text-right">

                              {project?.sanctionAmount !=
                              null
                                ? formatCurrency(
                                    project.sanctionAmount
                                  )
                                : "—"}

                            </td>

                            <td className="py-3 px-4 align-top">

                              <div className="font-semibold text-body-sm">
                                {riskLabel}
                              </div>

                              <div className="text-[11px] text-on-surface-variant mt-0.5">
                                Index{" "}
                                {riskIndex}
                              </div>

                            </td>

                            <td className="py-3 px-4 align-top">

                              <div
                                className={`inline-flex items-center gap-1.5 ${getSeverityClass(
                                  severity
                                )} font-bold text-body-sm`}
                              >

                                <span className="w-1.5 h-1.5 rounded-full bg-current" />

                                {severity ||
                                  "Detected"}

                              </div>

                            </td>

                            <td className="py-3 px-4 align-top">

                              <div className="font-bold text-body-sm tabular-nums">
                                {score > 0
                                  ? score
                                  : "—"}
                              </div>

                            </td>

                            <td className="py-3 px-4 align-top text-right">

                              <button
                                type="button"
                                className="text-body-sm font-semibold text-primary hover:underline"
                                onClick={() =>
                                  handleView(
                                    project
                                  )
                                }
                              >
                                View →
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">

                <span className="text-body-sm text-on-surface-variant">
                  Page {page} · Showing{" "}
                  {visibleProjects.length}{" "}
                  projects ·{" "}
                  {filteredProjects.length}{" "}
                  matching
                </span>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-outline-variant text-body-sm disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >= totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current + 1
                          )
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-outline-variant text-body-sm disabled:opacity-50"
                  >
                    Next
                  </button>

                </div>

              </div>

            </>
          )}

        </section>

        <footer className="pt-2 pb-6 text-center">

          <p className="text-label-sm text-on-surface-variant">
            National Informatics Centre · Ministry of Statistics and Programme Implementation
          </p>

        </footer>

      </main>

    </div>
  );
}