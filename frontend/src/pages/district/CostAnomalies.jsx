import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dataService } from "../../services/dataService";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Drawer } from "../../components/common/Drawer";
import {
  AlertTriangle,
  ShieldAlert,
  FileSearch,
  ArrowUpRight,
} from "lucide-react";

export const CostAnomalies = () => {
  const navigate = useNavigate();

  const [boqItems, setBoqItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoq, setSelectedBoq] = useState(null);

  useEffect(() => {
    async function loadBOQ() {
      try {
        const response = await dataService.fetchCostAnomaliesBOQ();
        setBoqItems(response || []);
      } catch (err) {
        console.error("Failed to fetch BOQ anomalies:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBOQ();
  }, []);

  const columns = [
    {
      title: "Item ID",
      key: "id",
      render: (v) => (
        <span className="font-mono font-semibold text-primary">{v}</span>
      ),
    },
    {
      title: "Item Description",
      key: "itemDescription",
      render: (v) => (
        <span className="font-semibold text-on-surface line-clamp-1">{v}</span>
      ),
    },
    {
      title: "Claimed Rate",
      key: "claimedUnitRate",
      isNumeric: true,
      render: (v) => (
        <span className="font-bold text-error">
          ₹{Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      title: "State SOR Benchmark",
      key: "sorBenchmarkRate",
      isNumeric: true,
      render: (v) => (
        <span className="font-semibold text-on-surface">
          ₹{Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Variance %",
      key: "variancePercent",
      isNumeric: true,
      render: (v) => (
        <span className="font-bold text-red-600">{v}%</span>
      ),
    },
    {
      title: "Severity",
      key: "severity",
      render: (v) => <StatusBadge type={v} status={v} />,
    },
    { title: "Contractor", key: "contractor" },
    {
      title: "Action",
      key: "id",
      align: "right",
      render: (_, row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBoq(row);
          }}
        >
          Inspect BOQ
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-space-lg">
        <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-lg animate-pulse">
          <div className="h-8 w-72 bg-surface-container-high rounded mb-4" />
          <div className="h-4 w-96 bg-surface-container-high rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] uppercase font-bold tracking-wider">
              BOQ COST RADAR
            </span>
            <span className="text-label-sm text-on-surface-variant font-mono">
              UP PWD Schedule of Rates (SOR-2026)
            </span>
          </div>

          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            Unit Cost Variance Radar
          </h1>

          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Automated benchmarking of project Bill of Quantities (BOQ) line
            items against State Schedule of Rates.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <Button
            variant="secondary"
            onClick={() => navigate("/district/overview")}
          >
            ← Overview
          </Button>

          <Button
            variant="primary"
            onClick={() =>
              alert("BOQ Rate Benchmark updated with Q3 State PWD Rates.")
            }
          >
            Update SOR Benchmark
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <StatCard
          title="Total Estimates Screened"
          value={`${boqItems.length} Works`}
          subtitle="FY 2026-27 Submissions"
          icon={FileSearch}
        />

        <StatCard
          title="Cost Inflation Alerts"
          value={`${boqItems.filter((i) => i.severity !== "LOW").length} Line Items`}
          subtitle=">20% Variance over SOR"
          badgeText="FLAGGED"
          badgeType="critical"
          icon={AlertTriangle}
        />

        <StatCard
          title="Avg Variance over SOR"
          value={`+${
            (
              boqItems.reduce(
                (s, i) => s + Number(i.variancePercent || 0),
                0
              ) / Math.max(boqItems.length, 1)
            ).toFixed(1)
          }%`}
          subtitle="Across flagged items"
          badgeText="HIGH VARIANCE"
          badgeType="warning"
          icon={ShieldAlert}
        />
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-surface-container-high">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
              Flagged BOQ Line-Item Variances
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Line items exceeding standard State Schedule of Rates threshold
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={boqItems}
          pageSize={10}
          onRowClick={(row) => setSelectedBoq(row)}
        />
      </div>

      {/* Drawer */}
      {selectedBoq && (
        <Drawer
          isOpen={!!selectedBoq}
          onClose={() => setSelectedBoq(null)}
          title={`BOQ Line Item Inspection: ${selectedBoq.id}`}
          subtitle={selectedBoq.contractor}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setSelectedBoq(null)}
              >
                Close
              </Button>

              <Button
                variant="danger"
                onClick={() => {
                  alert(
                    `Revision Order issued for ${selectedBoq.id}. Vendor notified.`
                  );
                  setSelectedBoq(null);
                }}
              >
                Issue BOQ Rate Revision Order
              </Button>
            </>
          }
        >
          <div className="space-y-space-md text-body-sm">
            <div className="p-space-md bg-red-50 border border-red-200 rounded">
              <div className="text-label-sm font-bold text-red-900 uppercase">
                Unit Cost Overrun Alert
              </div>

              <div className="text-numeric-metric font-numeric-metric font-bold text-red-700 my-1">
                {selectedBoq.variancePercent}%
              </div>

              <p className="text-body-sm text-red-800">
                Claimed rate is ₹
                {Number(selectedBoq.claimedUnitRate).toLocaleString()}
                compared to State SOR benchmark rate of ₹
                {Number(selectedBoq.sorBenchmarkRate).toLocaleString()}.
              </p>
            </div>

            <div className="space-y-2 pt-space-xs border-t border-surface-container-high">
              <h5 className="font-bold text-headline-sm text-on-surface">
                Specification Details
              </h5>

              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                {selectedBoq.itemDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-space-md bg-surface-container-low border rounded">
              <div>
                <span className="text-label-sm text-on-surface-variant uppercase">
                  Claimed Total
                </span>
                <div className="text-headline-md font-bold text-on-surface">
                  {selectedBoq.claimedTotal}
                </div>
              </div>

              <div>
                <span className="text-label-sm text-on-surface-variant uppercase">
                  Benchmark Total
                </span>
                <div className="text-headline-md font-bold text-secondary">
                  {selectedBoq.benchmarkTotal}
                </div>
              </div>
            </div>

            <div className="pt-space-md">
              <Button
                variant="primary"
                className="w-full justify-between"
                onClick={() =>
                  navigate(
                    `/investigation/${
                      selectedBoq.projectId ||
                      selectedBoq.workId ||
                      selectedBoq.id
                    }`
                  )
                }
              >
                <span>Open Project Forensic Investigation</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};