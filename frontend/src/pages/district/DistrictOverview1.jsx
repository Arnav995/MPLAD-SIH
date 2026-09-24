import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Building2, IndianRupee, CheckCircle2, AlertTriangle, Layers, ArrowUpRight } from 'lucide-react';

export const DistrictOverview1 = () => {
  const navigate = useNavigate();

const [district, setDistrict] = useState(null);
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadDashboard() {
    try {
      const [districtRes, projectRes] = await Promise.all([
        dataService.fetchDistrictOverview(),
        dataService.fetchProjects(),
      ]);

      setDistrict(districtRes);
      setProjects(projectRes.projects ?? projectRes);
    } catch (err) {
      console.error("Failed to load district overview:", err);
    } finally {
      setLoading(false);
    }
  }

  loadDashboard();
}, []);

if (loading) {
  return (
    <div className="space-y-space-lg">
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-lg animate-pulse">
        <div className="h-8 w-64 bg-surface-container-high rounded mb-4" />
        <div className="h-4 w-96 bg-surface-container-high rounded" />
      </div>
    </div>
  );
}

if (!district) return null;

  const columns = [
    { title: 'Project Code', key: 'id', render: (v) => <span className="font-mono font-semibold text-primary group-hover:underline">{v}</span> },
    { title: 'Project Title', key: 'title', render: (v) => <span className="font-semibold text-on-surface">{v}</span> },
    { title: 'Sector', key: 'sector' },
    { title: 'Sanctioned Cost', key: 'sanctionedAmount', isNumeric: true, render: (v) => <span className="font-bold">{v}</span> },
    { title: 'Stage', key: 'status', render: (v) => <StatusBadge type={v} status={v} /> },
    { title: 'Risk Assessment', key: 'riskLevel', render: (v) => <StatusBadge type={v} status={v} /> },
    {
      title: 'Action',
      key: 'id',
      align: 'right',
      render: (_, row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/investigation/${row.work_id}`);
          }}
        >
          Inspect
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-space-lg">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] uppercase font-bold tracking-wider">
              DISTRICT TERMINAL
            </span>
            <span className="text-label-sm text-on-surface-variant">{district.collectorName}</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            {district.districtName} District Overview
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            District Collector Implementation & Forensic Oversight Terminal — {district.state}.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <Button variant="secondary" onClick={() => navigate('/district/financial-analytics')}>
            Financial Analytics →
          </Button>
          <Button variant="primary" onClick={() => navigate('/district/duplicate-detection')}>
            AI Duplicate Scan
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <StatCard
          title="Total District Allocation"
          value={district.totalAllocation}
          subtitle="MPLADS Entitlement FY 2026-27"
          icon={IndianRupee}
        />
        <StatCard
          title="Sanctioned & Disbursed"
          value={district.sanctionedDisbursed}
          subtitle="77.6% Utilization Rate"
          badgeText="HEALTHY"
          badgeType="success"
          icon={CheckCircle2}
        />
        <StatCard
          title="Active Projects"
          value={district.activeWorks}
          subtitle="Across 5 Administrative Blocks"
          icon={Layers}
        />
        <StatCard
          title="AI Anomaly Alerts"
          value={district.pendingAlertsCount}
          subtitle="High Risk Duplicate & Cost Flags"
          badgeText="ACTION REQUIRED"
          badgeType="critical"
          icon={AlertTriangle}
        />
      </div>

      {/* Work Stages Pipeline */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-surface-container-high">
          <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">Work Implementation Pipeline</h3>
          <span className="text-label-sm text-on-surface-variant font-mono">{projects.length} Total Projects</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-space-sm">
          {district.workStages.map((st, idx) => (
            <div key={idx} className="p-space-sm bg-surface-container-low border border-surface-container-high rounded-[6px] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:border-outline">
              <div className="text-label-sm font-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
                {st.stage}
              </div>
              <div className="text-headline-md font-headline-md font-bold text-on-surface mt-1 num-tabular">
                {st.count} <span className="text-body-sm text-on-surface-variant font-normal">Works</span>
              </div>
              <div className="text-label-sm text-on-surface-variant mt-0.5">{st.amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Urgent Anomaly Banner */}
      <div className="bg-red-50 border border-red-200 rounded-[8px] p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md transition-all duration-200 hover:border-red-300 hover:shadow-[0_4px_16px_rgba(186,26,26,0.08)]">
        <div className="flex items-start gap-space-sm">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105" />
          <div>
            <h4 className="text-headline-sm font-headline-sm font-bold text-red-900">
              Critical Anomaly Flagged on Project PRJ-2026-VAR-089
            </h4>
            <p className="text-body-sm text-red-800 mt-0.5">
              Vector Match (94% spec overlap with UPREDA state scheme) and +86.5% unit cost overrun on Solar LED Luminaire.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="danger" size="sm" onClick={() => navigate('/investigation/PRJ-2026-VAR-089')}>
            Inspect Investigation File
          </Button>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-surface-container-high">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">Active Constituency Works</h3>
            <p className="text-label-sm text-on-surface-variant">Live tracking of recommended, sanctioned, and executed projects</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/district/cost-anomalies')}>
            Cost Variance Radar →
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={projects}
          pageSize={5}
          onRowClick={(row) => navigate(`/investigation/${row.work_id}`)}
        />
      </div>
    </div>
  );
};
