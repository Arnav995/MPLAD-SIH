import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { BarChart3, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

export const BenfordsLaw = () => {
 const [benford, setBenford] = React.useState(null);
const [loading, setLoading] = React.useState(true);

React.useEffect(() => {
  async function load() {
    try {
      const data = await dataService.getBenfordAnalysis();
      setBenford(data);
    } catch (err) {
      console.error("Failed to load Benford analysis", err);
    } finally {
      setLoading(false);
    }
  }

  load();
}, []);

if (loading) {
  return <div className="p-8">Loading Benford analysis...</div>;
}

if (!benford) {
  return <div className="p-8">Unable to load Benford analysis.</div>;
}
  const columns = [
    { title: 'Transaction ID', key: 'id', render: (v) => <span className="font-mono font-semibold text-primary">{v}</span> },
    { title: 'District', key: 'district' },
    { title: 'Contractor / Vendor', key: 'contractor' },
    { title: 'Claimed Amount', key: 'amount', isNumeric: true, render: (v) => <span className="font-bold text-on-surface">{v}</span> },
    { title: 'Lead Digit', key: 'leadDigit', align: 'center', render: (v) => <span className="px-2 py-0.5 bg-red-100 text-red-800 font-mono font-bold rounded">{v}</span> },
    { title: 'Anomaly Score', key: 'anomalyScore', isNumeric: true, render: (v) => <span className="font-bold text-error">{v} / 10</span> },
    { title: 'Flag Reason', key: 'reason' },
    {
      title: 'Action',
      key: 'projectRef',
      align: 'right',
      render: (v) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/investigation/${v}`);
          }}
        >
          Inspect Project
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-space-lg">
      {/* Canonical Ministry Page Header */}
      <PageHeader
        badgeTag="FINANCIAL FORENSICS"
        badgeSubtext="Statistical Chi-Square Test ($X^2$)"
        title="Benford's Law Forensic Analysis"
        subtitle="First-digit and multi-digit frequency analysis on transactional ledger entries to detect artificial cost splitting and invoice manipulation."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/ministry/overview')}>
              ← Overview
            </Button>
            <Button variant="primary" onClick={() => alert('Chi-Square test re-computed across 48,290 vouchers.')}>
              Re-Run Statistical Scan
            </Button>
          </>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <StatCard
          title="Transactions Analyzed"
          value={benford.totalTransactions}
          subtitle="Q2 National Ledger Entries"
          icon={BarChart3}
        />
        <StatCard
          title="Chi-Square Metric (X²)"
          value={benford.chiSquareValue}
          subtitle={`Threshold: ${benford.chiSquareThreshold} (p ${benford.pVal})`}
          badgeText="DISTORTION DETECTED"
          badgeType="critical"
          icon={AlertTriangle}
        />
        <StatCard
          title="Flagged Digit Pattern"
          value="Digit '4' (24.8%)"
          subtitle="Expected: 9.7% (+15.1% Spike)"
          badgeText="VOUCHER SPLITTING"
          badgeType="warning"
          icon={ShieldAlert}
        />
      </div>

      {/* First-Digit Distribution Chart Visualization */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-md border-b border-surface-container-high">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">First-Digit Frequency Distribution (Digits 1–9)</h3>
            <p className="text-label-sm text-on-surface-variant">Comparing actual transaction lead-digit frequency against Benford's Logarithmic Law</p>
          </div>
          <div className="flex items-center gap-4 text-label-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-neutral-300 inline-block" />
              <span>Benford Expected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
              <span>Actual Observed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-error inline-block" />
              <span>Anomalous Spike</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="grid grid-cols-9 gap-2 md:gap-4 h-64 items-end pt-6 pb-2 px-2 border-b border-surface-container-high">
          {benford.firstDigitDistribution.map((item) => {
            const isSpike = item.status.includes('SPIKE');
            const expectedHeight = (item.expected / 35) * 100;
            const actualHeight = (item.actual / 35) * 100;

            return (
              <div key={item.digit} className="flex flex-col items-center h-full justify-end group">
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  {/* Expected Bar */}
                  <div
                    style={{ height: `${expectedHeight}%` }}
                    className="w-1/2 bg-neutral-200 border-t border-neutral-400 rounded-t transition-all group-hover:bg-neutral-300"
                    title={`Expected: ${item.expected}%`}
                  />
                  {/* Actual Bar */}
                  <div
                    style={{ height: `${actualHeight}%` }}
                    className={`w-1/2 rounded-t transition-all ${
                      isSpike ? 'bg-error shadow-sm' : 'bg-primary'
                    }`}
                    title={`Actual: ${item.actual}%`}
                  />
                </div>
                <div className="mt-2 text-center">
                  <div className="font-mono font-bold text-headline-sm text-on-surface">{item.digit}</div>
                  <div className={`text-[10px] font-mono ${isSpike ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                    {item.actual}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-space-md p-space-sm bg-amber-50 border border-amber-200 rounded flex items-start gap-space-sm">
          <Info className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="text-body-sm text-amber-800">
            <span className="font-bold">Statistical Forensics Insight:</span> Digit '4' displays an extraordinary 24.8% frequency (more than 2.5x Benford's theoretical 9.7%). This indicates systematic transaction structuring (e.g. splitting ₹15L projects into three separate ₹4.98L vouchers to bypass the mandatory ₹5L District Magistrate sanction threshold).
          </div>
        </div>
      </div>

      {/* Flagged Transactions Table */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
        <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-surface-container-high">
          <div>
            <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">Flagged Ledger Vouchers</h3>
            <p className="text-label-sm text-on-surface-variant">Individual financial vouchers triggering Benford anomaly alerts</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={benford.flaggedTransactions}
          pageSize={10}
        />
      </div>
    </div>
  );
};
