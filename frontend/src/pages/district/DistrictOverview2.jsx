import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { BarChart3, PieChart, TrendingUp, IndianRupee, Layers } from 'lucide-react';

export const DistrictOverview2 = () => {
  // const navigate = useNavigate();
  // const district = dataService.getDistrictOverview();
  // const projects = dataService.getProjects({ risk: 'HIGH' });
  const navigate = useNavigate();

const [district, setDistrict] = useState(null);
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadAnalytics() {
    try {
      const [districtRes, projectRes] = await Promise.all([
        dataService.fetchDistrictOverview(),
        dataService.fetchProjects({ tier: "TIER_2" }),
      ]);

      setDistrict(districtRes);
      setProjects(projectRes.projects ?? projectRes);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  loadAnalytics();
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
    { title: 'Project Code', key: 'id', render: (v) => <span className="font-mono font-semibold text-primary">{v}</span> },
    { title: 'Project Title', key: 'title', render: (v) => <span className="font-semibold text-on-surface">{v}</span> },
    { title: 'Sector', key: 'sector' },
    { title: 'Executing Agency', key: 'executingAgency' },
    { title: 'Cost', key: 'sanctionedAmount', isNumeric: true, render: (v) => <span className="font-bold">{v}</span> },
    { title: 'Risk Anomaly', key: 'anomalyType', render: (v) => <StatusBadge type="CRITICAL" status={v} /> },
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
          Inspect BOQ
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
              FINANCIAL ANALYTICS
            </span>
            <span className="text-label-sm text-on-surface-variant">District Varanasi (UP)</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            Sectoral Fund Utilization & Progress
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Detailed breakdown of constituency funds by sector, monthly disbursement velocity, and high-risk expenditure monitors.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <Button variant="secondary" onClick={() => navigate('/district/overview')}>
            ← Summary View
          </Button>
          <Button variant="primary" onClick={() => navigate('/district/cost-anomalies')}>
            Unit Cost Radar
          </Button>
        </div>
      </div>

      {/* Grid: Sector Allocation + Monthly Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Sector Allocation Progress Bars */}
        <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
          <div className="flex items-center justify-between pb-space-xs mb-space-md border-b border-surface-container-high">
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              <span>Sectoral Allocation Breakdown</span>
            </h3>
            <span className="text-label-sm text-on-surface-variant font-mono">₹25.0 Cr Entitlement</span>
          </div>

          <div className="space-y-space-md">
            {district.sectorAllocation.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="font-semibold text-on-surface">{sec.sector}</span>
                  <div className="text-label-sm text-on-surface-variant font-mono">
                    <span className="font-bold text-on-surface">{sec.allocated}</span> ({sec.percentage}%)
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                  <div
                    style={{ width: `${sec.percentage}%` }}
                    className="bg-primary h-full rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Disbursement Timeline */}
        <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
          <div className="flex items-center justify-between pb-space-xs mb-space-md border-b border-surface-container-high">
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Monthly Disbursement Velocity</span>
            </h3>
            <span className="text-label-sm text-on-surface-variant font-mono">₹ Cr / Month</span>
          </div>

          <div className="grid grid-cols-6 gap-2 h-48 items-end pt-4 pb-2 px-2 border-b border-surface-container-high">
            {district.monthlyDisbursement.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <div
                  style={{ height: `${(item.amount / 5.0) * 100}%` }}
                  className="w-full max-w-[36px] bg-primary rounded-t transition-all group-hover:bg-neutral-800 flex items-center justify-center text-[10px] text-white font-mono font-bold"
                >
                  {item.amount}
                </div>
                <div className="mt-2 text-label-sm font-label-sm text-on-surface-variant">{item.month}</div>
              </div>
            ))}
          </div>

          <div className="mt-space-md text-label-sm text-on-surface-variant flex items-center justify-between">
            <span>Peak Disbursement: <strong className="text-on-surface">Aug 2026 (₹4.8 Cr)</strong></span>
            <span>Average Monthly Velocity: <strong className="text-on-surface">₹3.2 Cr / mo</strong></span>
          </div>
        </div>
      </div>

      {/* High Risk Projects Inspection Section */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-surface-container-high">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">High-Risk Expenditure Monitor</h3>
            <p className="text-label-sm text-on-surface-variant">Projects flagged with cost inflation or duplicate specifications requiring District Authority review</p>
          </div>
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
