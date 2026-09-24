import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { IndianRupee, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight, Search, RefreshCw } from 'lucide-react';

export const NationalOverview = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    stats: dataService.getMinistryStats(),
    statePerformance: [],
    anomalyCategories: [],
    tier2Digest: null,
    topAlert: null,
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.fetchNationalOverviewData();
      setDashboardData(data);
    } catch (err) {
      console.error('[NationalOverview] Failed to load national dashboard data:', err);
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { stats, statePerformance, anomalyCategories, topAlert } = dashboardData;

  const handleReset = () => {
    setSearch('');
  };

  const filteredStateData = statePerformance.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (item.state && item.state.toLowerCase().includes(q)) ||
      (item.id && item.id.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      title: 'State / UT',
      key: 'state',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-on-surface">{val}</span>
          <span className="ml-2 text-label-sm text-on-surface-variant font-mono">({row.id})</span>
        </div>
      ),
    },
    { title: 'Total Allocation', key: 'allocation', isNumeric: true },
    { title: 'Disbursed', key: 'disbursed', isNumeric: true },
    {
      title: 'Utilization %',
      key: 'utilization',
      isNumeric: true,
      render: (val) => <span className="font-semibold">{val}</span>,
    },
    {
      title: 'Risk Level',
      key: 'riskLevel',
      render: (val) => <StatusBadge type={val} status={val} />,
    },
    {
      title: 'Flagged Exposure',
      key: 'flaggedAmount',
      isNumeric: true,
      render: (val) => <span className="font-semibold text-error">{val}</span>,
    },
    {
      title: 'Actions',
      key: 'id',
      align: 'right',
      render: (_, row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/district/overview`);
          }}
        >
          View District
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-space-lg">
      {/* Canonical Ministry Page Header */}
      <PageHeader
        badgeTag="NATIONAL OVERSIGHT"
        badgeSubtext="Ministry of Statistics & Programme Implementation"
        title="National Overview"
        subtitle="Real-time fiscal monitoring, anomaly detection, and constituency allocation tracking across all States and UTs."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/ministry/tier-2-digest')}>
              View Tier-2 Digest
            </Button>
            <Button variant="primary" onClick={() => navigate('/ministry/benfords-law')}>
              Benford Forensics
            </Button>
          </>
        }
      />

      {/* Error Notice if Backend is unreachable */}
      {error && (
        <div className="p-space-md bg-red-50 border border-red-200 text-red-900 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
            <div>
              <p className="font-semibold text-body-sm">Backend connection error</p>
              <p className="text-label-sm text-red-700">{error} — Verify backend server is active at http://localhost:4000/api</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <StatCard
          title="Total Allocated Funds"
          value={loading ? '...' : stats.totalAllocated}
          subtitle="FY 2026-27 Approved Budget"
          badgeText="ACTIVE CYCLE"
          icon={IndianRupee}
        />
        <StatCard
          title="Disbursed & Utilized"
          value={loading ? '...' : stats.disbursedUtilized}
          subtitle={`${stats.utilizationRate || '0.0%'} National Average`}
          badgeText="HEALTHY"
          badgeType="success"
          icon={CheckCircle2}
        />
        <StatCard
          title="Flagged Expenditure"
          value={loading ? '...' : stats.flaggedExpenditure}
          subtitle={`${stats.flaggedProjectsCount || 0} Projects Under Audit`}
          badgeText="ACTION REQUIRED"
          badgeType="critical"
          icon={ShieldAlert}
        />
        <StatCard
          title="Constituencies Audited"
          value={loading ? '...' : stats.activeConstituencies}
          subtitle={`${stats.districtsAudited || 0} Active Constituencies`}
          badgeText="LIVE COVERAGE"
          icon={AlertTriangle}
        />
      </div>

      {/* Main Grid: State Matrix Table + Anomaly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Left Column: State Performance Table (2 cols) */}
        <div className="lg:col-span-2 space-y-space-md">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
              <div>
                <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">State & UT Performance Matrix</h3>
                <p className="text-label-sm text-on-surface-variant">Comparative fund utilization and risk tier assessment</p>
              </div>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-outline" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter state..."
                  className="w-full pl-8 pr-2 py-1 bg-surface border border-surface-container-high rounded text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredStateData}
              pageSize={6}
              onResetFilters={handleReset}
              onRowClick={() => navigate('/district/overview')}
            />
          </div>
        </div>

        {/* Right Column: Anomaly Categories & Quick Links (1 col) */}
        <div className="space-y-space-md">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
            <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-surface-container-high">
              <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">Top Anomaly Vectors</h3>
              <span className="text-label-sm text-on-surface-variant font-mono">Q2-2026</span>
            </div>

            <div className="space-y-space-md">
              {anomalyCategories.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/ministry/tier-2-digest')}
                  className="p-space-sm bg-surface-container-low border border-surface-container-high rounded cursor-pointer hover:border-outline-variant transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-label-md font-label-md font-semibold text-on-surface">{cat.category}</span>
                    <span className="text-label-sm font-label-sm font-bold text-error">{cat.exposure}</span>
                  </div>
                  <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
                    <span>{cat.count} Flagged Incidents</span>
                    <span className="text-amber-800 font-semibold">{cat.trend} vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-space-md pt-space-sm border-t border-surface-container-high text-center">
              <button
                onClick={() => navigate('/ministry/tier-2-digest')}
                className="text-label-md font-label-md text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Inspect All Executive Digest Clusters</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Alert Card */}
          <div className="bg-amber-50/60 border border-amber-200 rounded p-space-md">
            <div className="flex items-start gap-space-sm">
              <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-label-md font-label-md font-bold text-amber-900">Immediate Action Required</h4>
                <p className="text-body-sm text-amber-800 mt-1">
                  {stats.tier2Count || 1080} high-severity anomaly clusters require executive sign-off before Tranche 2 release.
                </p>
                <div className="mt-space-sm">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/investigation/${topAlert?.work_id || '2508'}`)}
                  >
                    Inspect {topAlert?.constituency ? `${topAlert.constituency} PRJ-${topAlert.work_id}` : 'Top Escalation PRJ-2508'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
