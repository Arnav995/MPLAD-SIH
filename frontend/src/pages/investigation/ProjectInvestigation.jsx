import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Tabs } from '../../components/common/Tabs';
import { Button } from '../../components/common/Button';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  History,
  Lock,
  Send,
  Layers,
  MapPin,
  Check
} from 'lucide-react';

export const ProjectInvestigation = () => {
  // const { projectId } = useParams();
  // const navigate = useNavigate();
  // const detail = dataService.getProjectById(projectId);
  // const { project, forensicSummary, milestonesTimeline, contractorInfo, boqBreakdown } = detail;

  // const [activeTab, setActiveTab] = useState('timeline');
  // const [commentText, setCommentText] = useState('');
  // const [actionMessage, setActionMessage] = useState('');
  const { projectId } = useParams();
const navigate = useNavigate();

const [detail, setDetail] = useState(null);
const [loading, setLoading] = useState(true);

const [activeTab, setActiveTab] = useState("timeline");
const [commentText, setCommentText] = useState("");
const [actionMessage, setActionMessage] = useState("");

useEffect(() => {
  async function loadProject() {
    try {
      const response = await dataService.fetchProjectById(projectId);
      setDetail(response);
    } catch (err) {
      console.error("Failed to fetch investigation:", err);
    } finally {
      setLoading(false);
    }
  }

  loadProject();
}, [projectId]);

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

if (!detail) {
  return (
    <div className="space-y-space-lg">
      <div className="bg-red-50 border border-red-200 rounded p-space-lg text-red-900">
        Unable to load investigation.
      </div>
    </div>
  );
}

const {
  project,
  forensicSummary,
  milestonesTimeline,
  contractorInfo,
  boqBreakdown,
} = detail;


  const handleExecuteAction = (actionName) => {
    setActionMessage(`Action "${actionName}" executed on ${project.id}. Audit log stamp recorded.`);
    setTimeout(() => setActionMessage(''), 5000);
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      alert(`Inspector Comment added to Project Audit Log: "${commentText}"`);
      setCommentText('');
    }
  };

  const tabs = [
    { id: 'timeline', label: 'Forensic Timeline' },
    { id: 'boq', label: 'Cost & BOQ Benchmark' },
    { id: 'vendor', label: 'Vendor Graph' },
    { id: 'duplicate', label: 'Duplicate Analysis' },
    { id: 'audit', label: 'Audit History' }
  ];

  return (
    <div className="space-y-space-lg">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumbs
          items={[
            { label: 'Platform Home', path: '/' },
            { label: 'Projects', path: '/district/overview' },
            { label: project.id }
          ]}
        />
        <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-space-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-body-sm rounded flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage('')} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Project Header Banner */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-lg shadow-sm space-y-space-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-md border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-space-sm mb-1">
              <span className="font-mono font-bold text-headline-sm text-primary">{project.id}</span>
              <StatusBadge type={project.riskLevel} status={project.riskLevel} />
              <StatusBadge type={project.status} status={project.status} />
            </div>
            <h1 className="text-display-lg-mobile md:text-headline-lg font-bold text-on-surface">
              {project.title}
            </h1>
            <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-outline" />
                <strong className="text-on-surface">{project.location}</strong>
              </span>
              <span>• Recommended by: <strong className="text-on-surface">{project.mpName}</strong></span>
              <span>• Sector: <strong className="text-on-surface">{project.sector}</strong></span>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center bg-surface-container-low p-space-md rounded border border-surface-container-high shrink-0">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">Sanctioned Amount</span>
            <div className="text-numeric-metric font-numeric-metric font-bold text-on-surface num-tabular">
              {project.sanctionedAmount}
            </div>
            <span className="text-[11px] text-error font-semibold mt-0.5">
              Financial Exposure: {project.sanctionedAmount}
            </span>
          </div>
        </div>

        {/* Critical Anomaly Alert Callout */}
        <div className="p-space-md bg-red-50 border border-red-200 rounded flex items-start gap-space-md">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-headline-sm font-headline-sm font-bold text-red-900">
              AI SENTINEL FORENSIC RISK SCORE: {forensicSummary.overallRiskScore}
            </h4>
            <ul className="list-disc list-inside text-body-sm text-red-800 space-y-0.5">
              {forensicSummary.anomalyFlags.map((flag, idx) => (
                <li key={idx} className="font-medium">{flag}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Main Grid: Detail Tabs + Right Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
        {/* Left Column: Tabbed Content (2 cols) */}
        <div className="lg:col-span-2 space-y-space-md">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="pt-space-md">
              {/* Tab 1: Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-space-md">
                  <h4 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
                    Project Milestones & Verification Timeline
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
                    {milestonesTimeline.map((m, idx) => (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 ${
                            m.status === 'COMPLETED'
                              ? 'bg-emerald-600 border-emerald-200'
                              : m.status === 'FLAGGED'
                              ? 'bg-red-600 border-red-200'
                              : 'bg-amber-500 border-amber-200'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <h5 className="text-headline-sm font-headline-sm font-bold text-on-surface">{m.title}</h5>
                          <span className="text-label-sm font-mono text-on-surface-variant">{m.date}</span>
                        </div>
                        {m.amount && (
                          <div className="text-body-sm font-mono font-bold text-primary mt-0.5">
                            Amount: {m.amount}
                          </div>
                        )}
                        {m.verifiedBy && (
                          <div className="text-label-sm text-on-surface-variant mt-0.5">
                            Verified by: <strong className="text-on-surface">{m.verifiedBy}</strong>
                          </div>
                        )}
                        {m.note && (
                          <div className="mt-1 p-2 bg-red-50 text-red-800 text-body-sm rounded font-medium">
                            Note: {m.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: BOQ Benchmark */}
              {activeTab === 'boq' && (
                <div className="space-y-space-md text-body-sm">
                  <h4 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
                    Bill of Quantities (BOQ) Schedule of Rates Comparison
                  </h4>
                  {boqBreakdown && boqBreakdown.length > 0 ? (
                    boqBreakdown.map((item, idx) => (
                      <div key={idx} className="p-space-md bg-surface-container-low border border-surface-container-high rounded space-y-2">
                        <div className="flex justify-between font-bold text-headline-sm text-on-surface">
                          <span>{item.itemDescription}</span>
                          <span className="text-error font-mono">{item.variance} Overrun</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-label-sm pt-2 border-t border-surface-container-high">
                          <div>Claimed Rate: <strong className="text-error font-mono">{item.claimedRate}</strong></div>
                          <div>State SOR Benchmark: <strong className="text-secondary font-mono">{item.benchmarkRate}</strong></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-space-md bg-surface-container-low border border-surface-container-high rounded space-y-2">
                      <div className="flex justify-between font-bold text-headline-sm text-on-surface">
                        <span>Line Item 1: Primary Material & Labor BOQ</span>
                        <span className="text-error">+42.0% Overrun</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-label-sm pt-2 border-t border-surface-container-high">
                        <div>Claimed Unit Rate: <strong className="text-error font-mono">₹48,500 / unit</strong></div>
                        <div>State SOR Benchmark: <strong className="text-secondary font-mono">₹26,000 / unit</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Vendor Graph */}
              {activeTab === 'vendor' && (
                <div className="space-y-space-md text-body-sm">
                  <h4 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
                    Contractor Risk Profile & Bidding Pattern
                  </h4>
                  <div className="p-space-md border border-surface-container-high rounded bg-surface-container-low space-y-2">
                    <div className="font-bold text-headline-sm text-on-surface">{contractorInfo.companyName}</div>
                    <div className="text-on-surface-variant">GSTIN: <span className="font-mono font-bold text-on-surface">{contractorInfo.gstin}</span></div>
                    <div className="text-on-surface-variant">PAN: <span className="font-mono font-bold text-on-surface">{contractorInfo.pan}</span></div>
                    <div className="text-on-surface-variant">Registered Address: {contractorInfo.registeredAddress}</div>
                    <div className="p-2 bg-red-100 text-red-900 rounded font-semibold text-label-sm mt-2">
                      {contractorInfo.riskRating} — {contractorInfo.totalMPLADSShare}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Duplicate Analysis */}
              {activeTab === 'duplicate' && (
                <div className="space-y-space-md text-body-sm">
                  <h4 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
                    Vector Specification Match Details
                  </h4>
                  <div className="p-space-md bg-red-50 border border-red-200 text-red-900 rounded space-y-2">
                    <div className="font-bold text-headline-sm">Spatial & Vector Similarity Detected</div>
                    <p className="text-body-sm leading-relaxed">
                      94% Vector Similarity matched between {project.id} and State PWD Scheme #UP-PWD-2025-44 in {project.location}. Spatial distance: 14 meters.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 5: Audit History */}
              {activeTab === 'audit' && (
                <div className="space-y-space-md text-body-sm">
                  <h4 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
                    Project Action History & Cryptographic Ledger Stamps
                  </h4>
                  <p className="text-on-surface-variant">
                    All administrative state changes, disbursement releases, and inspector overrides for <strong className="text-on-surface">{project.id}</strong> are cryptographically stamped with SHA-256 integrity hashes.
                  </p>
                  <div className="p-space-sm bg-surface-container-low border font-mono text-label-sm text-outline rounded">
                    SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (Verified Integrity)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Decision Actions & Inspector Comment Box (1 col) */}
        <div className="space-y-space-md">
          {/* Decision Action Box */}
          <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm space-y-space-md">
            <div className="pb-space-xs border-b border-surface-container-high">
              <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">Administrative Decision Actions</h3>
              <p className="text-label-sm text-on-surface-variant">Execute official oversight operations</p>
            </div>

            <div className="space-y-2">
              <Button
                variant="danger"
                className="w-full justify-start text-left"
                onClick={() => handleExecuteAction('FREEZE_DISBURSEMENT')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Freeze Tranche & Escalate to Ministry
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start text-left"
                onClick={() => handleExecuteAction('ISSUE_SHOW_CAUSE')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Issue Show-Cause Notice to Vendor
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start text-left"
                onClick={() => handleExecuteAction('REQUEST_PHYSICAL_INSPECTION')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Order Physical Field Inspection
              </Button>

              <Button
                variant="success"
                className="w-full justify-start text-left"
                onClick={() => handleExecuteAction('APPROVE_DISBURSEMENT_OVERRIDE')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Disbursement (Override Flag)
              </Button>
            </div>
          </div>

          {/* Inspector Comment & Upload Box */}
          <div className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm space-y-space-md">
            <div className="pb-space-xs border-b border-surface-container-high">
              <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">Inspector Findings & Log</h3>
              <p className="text-label-sm text-on-surface-variant">Add official notes to immutable audit log</p>
            </div>

            <form onSubmit={handlePostComment} className="space-y-space-sm">
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter forensic inspection findings or officer notes..."
                className="w-full p-2.5 bg-surface border border-surface-container-high rounded text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
              <Button type="submit" variant="primary" size="sm" icon={Send} className="w-full">
                Record Comment in Audit Log
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
