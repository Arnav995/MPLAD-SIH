import React from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { FileText, AlertTriangle, ShieldAlert, ArrowUpRight, CheckCircle } from 'lucide-react';

export const Tier2Digest = () => {
  const navigate = useNavigate();
  const digest = dataService.getTier2Digest();

  const columns = [
    { title: 'Escalation ID', key: 'id', render: (v) => <span className="font-mono font-semibold text-primary">{v}</span> },
    { title: 'State', key: 'state' },
    { title: 'District', key: 'district' },
    { title: 'Anomaly Category', key: 'category' },
    {
      title: 'Risk Score',
      key: 'riskScore',
      isNumeric: true,
      render: (v) => <span className="font-bold text-error">{v} / 10</span>
    },
    { title: 'Exposure', key: 'exposure', isNumeric: true, render: (v) => <span className="font-bold text-on-surface">{v}</span> },
    {
      title: 'Status',
      key: 'status',
      render: (v) => <StatusBadge type={v} status={v} />
    },
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
            navigate(`/investigation/PRJ-2026-VAR-089`);
          }}
        >
          Inspect Record
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Canonical Ministry Page Header */}
      <PageHeader
        badgeTag="MINISTRY DIGEST"
        badgeSubtext={digest.digestPeriod}
        title="Tier-2 Executive Digest"
        subtitle="Bi-weekly synthesized anomaly report and risk escalation digest for senior ministry officials."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/ministry/overview')}>
              ← National Overview
            </Button>
            <Button variant="primary" onClick={() => alert('Digest Report exported as PDF.')}>
              Download Full Digest (PDF)
            </Button>
          </>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Critical Clusters Escalated"
          value={digest.criticalCount}
          subtitle="High-severity risks"
          badgeText="ACTION REQUIRED"
          badgeType="critical"
          icon={AlertTriangle}
        />
        <StatCard
          title="Total Flagged Exposure"
          value={digest.flaggedExposure}
          subtitle="Under active investigation"
          badgeText="FROZEN TRANCHES"
          badgeType="warning"
          icon={ShieldAlert}
        />
        <StatCard
          title="District Compliance Index"
          value={digest.districtComplianceIndex}
          subtitle="Audit compliance rate"
          badgeText="GOOD"
          badgeType="success"
          icon={CheckCircle}
        />
      </div>

      {/* Highlight Clusters Cards */}
      <div className="space-y-4">
        <h3 className="text-[18px] font-bold text-on-surface flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span>High Priority Anomaly Clusters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {digest.highlightClusters.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-surface-container-lowest border border-surface-container-high rounded-[8px] p-5 flex flex-col justify-between hover:border-outline transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-mono font-bold text-primary">{cluster.id}</span>
                  <StatusBadge type={cluster.severity} status={cluster.severity} />
                </div>
                <h4 className="text-[16px] leading-[22px] font-bold text-on-surface mb-1.5">
                  {cluster.title}
                </h4>
                <div className="text-[12px] text-on-surface-variant mb-3">
                  District: <span className="font-semibold text-on-surface">{cluster.district}</span> • Exposure:{' '}
                  <span className="font-bold text-error">{cluster.exposure}</span>
                </div>
                <p className="text-[13px] leading-[20px] text-on-surface-variant mb-4">
                  {cluster.description}
                </p>
              </div>

              <div className="pt-3 border-t border-surface-container-high flex flex-col gap-2.5">
                <div className="text-[11px] text-amber-900 font-semibold leading-normal">
                  <span className="text-amber-800 font-bold uppercase mr-1">Recommendation:</span> {cluster.recommendedAction}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full justify-between"
                  onClick={() => navigate('/investigation/PRJ-2026-VAR-089')}
                >
                  <span>Inspect Forensic File</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Escalation Matrix Table */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-[8px] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-container-high">
          <div>
            <h3 className="text-[18px] font-bold text-on-surface">Regional Risk Escalation Matrix</h3>
            <p className="text-[12px] text-on-surface-variant">Active state escalations prioritized by algorithmic risk score</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={digest.escalationMatrix}
          pageSize={10}
          onRowClick={() => navigate('/investigation/PRJ-2026-VAR-089')}
        />
      </div>
    </div>
  );
};
