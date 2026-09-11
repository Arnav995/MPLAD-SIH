import React from "react";
import { useNavigate } from "react-router-dom";

export default function DistrictAuditLogs() {
  const navigate = useNavigate();

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
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
          </button>

          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            title="Help"
          >
            <span className="material-symbols-outlined text-[20px]">
              help
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-6 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
            <button
              type="button"
              onClick={() =>
                navigate("/district/overview")
              }
              className="hover:text-on-surface transition-colors"
            >
              District Oversight
            </button>

            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>

            <span className="font-semibold text-on-surface">
              Audit Logs
            </span>
          </div>

          <h1 className="text-headline-lg font-bold tracking-tight">
            Audit Logs
          </h1>

          <p className="text-body-sm text-on-surface-variant">
            Review history is not available in the current MVP backend.
          </p>
        </div>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                history
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-headline-sm font-semibold">
                Audit history is not yet available
              </h2>

              <p className="text-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
                The current MVP records project data, risk assessments,
                risk signals, duplicate candidates, expenditures and
                reviews, but it does not expose a separate audit-log
                history API.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h2 className="text-headline-sm font-semibold">
              Available evidence in the MVP
            </h2>

            <p className="text-body-sm text-on-surface-variant mt-1">
              These are the project-level records currently available
              for investigation.
            </p>
          </div>

          <div className="divide-y divide-outline-variant">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  fact_check
                </span>

                <div>
                  <div className="text-body-sm font-semibold">
                    Project records
                  </div>

                  <div className="text-label-sm text-on-surface-variant">
                    Recommendation, sanction, completion and project metadata
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/district/overview")
                }
                className="text-body-sm font-semibold text-primary hover:underline"
              >
                View projects →
              </button>
            </div>

            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  monitoring
                </span>

                <div>
                  <div className="text-body-sm font-semibold">
                    Risk signals
                  </div>

                  <div className="text-label-sm text-on-surface-variant">
                    Cost anomaly, duplicate/overlap and other detected signals
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/district/cost-anomalies")
                }
                className="text-body-sm font-semibold text-primary hover:underline"
              >
                View anomalies →
              </button>
            </div>

            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  content_copy
                </span>

                <div>
                  <div className="text-body-sm font-semibold">
                    Duplicate candidates
                  </div>

                  <div className="text-label-sm text-on-surface-variant">
                    Candidate work pairs produced by duplicate detection
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/district/duplicates")
                }
                className="text-body-sm font-semibold text-primary hover:underline"
              >
                View duplicates →
              </button>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant mt-0.5">
              info
            </span>

            <div>
              <h3 className="text-body-sm font-semibold">
                Why this page is intentionally limited
              </h3>

              <p className="text-label-md text-on-surface-variant mt-1 leading-relaxed">
                An audit history requires recorded user actions,
                timestamps, identities and review-state changes.
                Those records are not part of the current MVP backend,
                so this page does not present synthetic activity as
                real audit evidence.
              </p>
            </div>
          </div>
        </section>

        <footer className="pt-4 pb-6 border-t border-outline-variant text-center">
          <p className="text-label-sm text-on-surface-variant">
            National Informatics Centre · Ministry of Statistics and Programme Implementation
          </p>
        </footer>
      </main>
    </div>
  );
}