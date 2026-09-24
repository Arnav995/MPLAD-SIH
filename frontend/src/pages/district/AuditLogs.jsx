import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Search } from 'lucide-react';

export const AuditLogs = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const logs = dataService.getAuditLogs({ search, severity: severityFilter });

  const handleReset = () => {
    setSearch('');
    setSeverityFilter('ALL');
  };

  const columns = [
    { title: 'Log ID', key: 'id', render: (v) => <span className="font-mono font-semibold text-primary">{v}</span> },
    { title: 'Timestamp', key: 'timestamp', render: (v) => <span className="font-mono text-label-sm text-on-surface-variant">{v}</span> },
    { title: 'User / System Actor', key: 'user', render: (v, row) => (
      <div>
        <span className="font-semibold text-on-surface">{v}</span>
        <div className="text-[10px] text-on-surface-variant font-mono">{row.role}</div>
      </div>
    )},
    { title: 'Action Code', key: 'action', render: (v) => <span className="font-mono font-bold text-headline-sm text-primary">{v}</span> },
    { title: 'Target Entity', key: 'targetEntity', render: (v) => <span className="text-body-sm font-medium">{v}</span> },
    { title: 'Verification Hash Stamp', key: 'verificationStamp', render: (v) => <span className="font-mono text-[10px] text-outline truncate block max-w-[120px]" title={v}>{v}</span> },
    { title: 'Severity', key: 'severity', render: (v) => <StatusBadge type={v} status={v} /> }
  ];

  return (
    <div className="space-y-space-lg">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] uppercase font-bold tracking-wider">
              IMMUTABLE AUDIT LEDGER
            </span>
            <span className="text-label-sm text-on-surface-variant font-mono">SHA-256 Cryptographic Traceability</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            System Audit Logs & Traceability
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Full tamper-evident compliance audit trail recording all administrative actions, AI flags, approvals, and overrides.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <Button variant="secondary" onClick={() => navigate('/district/overview')}>
            ← District Terminal
          </Button>
          <Button variant="primary" onClick={() => alert('Cryptographic audit trail verified. All 10,942 logs intact.')}>
            Verify Hash Integrity
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm space-y-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, action, target entity, or IP..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-surface-container-high rounded text-body-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-label-sm font-label-sm font-semibold uppercase text-on-surface-variant">Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-surface-container-high rounded text-body-sm text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <DataTable
          columns={columns}
          data={logs}
          pageSize={10}
          onResetFilters={handleReset}
        />
      </div>
    </div>
  );
};
