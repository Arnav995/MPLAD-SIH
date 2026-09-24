import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { UserCheck, IndianRupee, CheckCircle2, FolderGit2, Plus, ArrowUpRight } from 'lucide-react';

export const MpDashboard = () => {
  const navigate = useNavigate();

const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadProjects() {
    try {
      const res = await dataService.fetchProjects();
      setProjects(res.projects ?? res);
    } catch (err) {
      console.error("Failed to load MP dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  loadProjects();
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
const totalFund = 50000000;

const recommendedAmount = projects.reduce(
  (sum, p) => sum + Number(p.sanction_amount || 0),
  0
);

const sanctionedAmount = projects
  .filter((p) => p.is_completed)
  .reduce((sum, p) => sum + Number(p.sanction_amount || 0), 0);

const completedWorks = projects.filter((p) => p.is_completed).length;

const allocationPct = (
  (recommendedAmount / totalFund) * 100
).toFixed(1);

const sanctionPct =
  recommendedAmount === 0
    ? "0.0"
    : ((sanctionedAmount / recommendedAmount) * 100).toFixed(1);

const formatCr = (amt) =>
  `₹${(amt / 10000000).toFixed(2)} Cr`;


  const columns = [
  {
    title: "Project Code",
    key: "work_id",
    render: (v) => (
      <span className="font-mono font-semibold text-primary">{v}</span>
    ),
  },
  {
    title: "Title of Recommended Work",
    key: "activity_name",
    render: (v) => (
      <span className="font-semibold text-on-surface">{v}</span>
    ),
  },
  { title: "Sector", key: "work_category" },
  {
    title: "Estimated Cost",
    key: "sanction_amount",
    isNumeric: true,
    render: (v) => (
      <span className="font-bold">₹{Number(v).toLocaleString()}</span>
    ),
  },
  {
    title: "Sanction Status",
    key: "is_completed",
    render: (v) => (
      <StatusBadge
        type={v ? "COMPLETED" : "IN_PROGRESS"}
        status={v ? "Completed" : "In Progress"}
      />
    ),
  },
  {
    title: "Action",
    key: "work_id",
    align: "right",
    render: (_, row) => (
      <Button
        size="sm"
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/investigation/${row.work_id}`);
        }}
      >
        Track Status
      </Button>
    ),
  },
];
  return (
    <div className="space-y-space-lg">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] uppercase font-bold tracking-wider">
              MEMBER OF PARLIAMENT
            </span>
            <span className="text-label-sm text-on-surface-variant font-mono">Varanasi Constituency</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            MP Constituency Portal
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Track recommended works, fund allocation progress, and district authority sanction velocity for Varanasi.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <Button variant="secondary" onClick={() => navigate('/mp/projects')}>
            View All My Projects →
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => alert('Opening Recommend New Work Modal...')}>
            Recommend New Work
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <StatCard
          title="Annual Entitled Fund"
          value="₹5.00 Cr"
          subtitle="FY 2026-27 Allocation"
          icon={IndianRupee}
        />
        <StatCard
          title="Recommended Works"
          value={formatCr(recommendedAmount)}
subtitle={`${allocationPct}% Utilized in Recommendations`}
badgeText={`${Math.round(allocationPct)}% ALLOCATED`}
          badgeType="success"
          icon={FolderGit2}
        />
        <StatCard
          title="District Sanctioned"
          value={formatCr(sanctionedAmount)}
          subtitle={`${sanctionPct}% Sanction Rate`}
          badgeText="ACTIVE"
          badgeType="success"
          icon={CheckCircle2}
        />
        <StatCard
          title="Completed & Delivered"
          value={`${completedWorks} Works`}
          subtitle="Handed over to community"
          icon={UserCheck}
        />
      </div>

      {/* Recommended Projects Pipeline */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-surface-container-high">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">My Recommended Infrastructure Works</h3>
            <p className="text-label-sm text-on-surface-variant">Real-time status updates from Varanasi District Collector office</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/mp/projects')}>
            View Full List
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
