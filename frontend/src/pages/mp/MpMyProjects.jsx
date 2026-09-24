import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Search } from 'lucide-react';

export const MpMyProjects = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [projects, setProjects] = useState([]);

useEffect(() => {
  async function loadProjects() {
    try {
      const filters = {};

      if (search) filters.search = search;
      if (sectorFilter !== "ALL") filters.category = sectorFilter;
      if (statusFilter !== "ALL") filters.status = statusFilter;

      const res = await dataService.fetchProjects(filters);
      setProjects(res.projects ?? res);
    } catch (err) {
      console.error("Failed to load MP projects:", err);
    }
  }

  loadProjects();
}, [search, sectorFilter, statusFilter]);

  const handleReset = () => {
    setSearch('');
    setSectorFilter('ALL');
    setStatusFilter('ALL');
  };

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
  { title: "Location", key: "constituency" },
  {
    title: "Estimated Cost",
    key: "sanction_amount",
    isNumeric: true,
    render: (v) => (
      <span className="font-bold">₹{Number(v).toLocaleString()}</span>
    ),
  },
  {
    title: "Date Recommended",
    key: "recommendation_date",
    render: (v) => (
      <span className="font-mono text-label-sm">{v ?? "—"}</span>
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
              RECOMMENDED LEDGER
            </span>
            <span className="text-label-sm text-on-surface-variant font-mono">Shri Narendra Modi — MP Varanasi</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            My Recommended Projects
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Complete official ledger of works recommended by MP with real-time district sanction status and milestone tracking.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <Button variant="secondary" onClick={() => navigate('/mp/dashboard')}>
            ← MP Dashboard
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm space-y-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recommended projects by title, code, or location..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface border border-surface-container-high rounded text-body-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-label-sm font-label-sm font-semibold uppercase text-on-surface-variant">Sector:</label>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-3 py-1.5 bg-surface border border-surface-container-high rounded text-body-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Sectors</option>
                <option value="Roads">Roads & Sanitation</option>
                <option value="Drinking Water">Drinking Water</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-label-sm font-label-sm font-semibold uppercase text-on-surface-variant">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-surface border border-surface-container-high rounded text-body-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="IN EXECUTION">In Execution</option>
                <option value="SANCTIONED">Sanctioned</option>
                <option value="TENDERED">Tendered</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <DataTable
          columns={columns}
          data={projects}
          pageSize={10}
          onResetFilters={handleReset}
          onRowClick={(row) => navigate(`/investigation/${row.work_id}`)}
        />
      </div>
    </div>
  );
};
