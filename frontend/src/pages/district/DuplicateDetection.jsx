import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { CopyCheck, ShieldAlert, CheckCircle2, MapPin, ArrowRight, FileText, Check, X } from 'lucide-react';

export const DuplicateDetection = () => {
  // const navigate = useNavigate();
  // const pairs = dataService.getDuplicateDetectionPairs();
  // const [selectedPair, setSelectedPair] = useState(null);
  // const [actionNotice, setActionNotice] = useState('');
const navigate = useNavigate();

const [pairs, setPairs] = useState([]);
const [loading, setLoading] = useState(true);

const [selectedPair, setSelectedPair] = useState(null);
const [actionNotice, setActionNotice] = useState("");

useEffect(() => {
  async function loadPairs() {
    try {
      const response = await dataService.fetchDuplicateDetectionPairs();
      setPairs(response);
    } catch (err) {
      console.error("Failed to fetch duplicate pairs:", err);
    } finally {
      setLoading(false);
    }
  }

  loadPairs();
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
  const handleAction = (pairId, actionType) => {
    setActionNotice(`Action "${actionType}" executed on Match Pair ${pairId}. Ledger updated.`);
    setTimeout(() => setActionNotice(''), 4000);
  };

  return (
    <div className="space-y-space-lg">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] uppercase font-bold tracking-wider">
              AI VECTOR MATCHING
            </span>
            <span className="text-label-sm text-on-surface-variant font-mono">Spatial & Spec Similarity Engine</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            Duplicate Proposal Detection
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            AI-powered spatial proximity and specification vector matching to prevent double-funding of identical infrastructure proposals.
          </p>
        </div>
        <div className="flex items-center gap-space-sm">
          <Button variant="secondary" onClick={() => navigate('/district/overview')}>
            ← District Terminal
          </Button>
          <Button variant="primary" onClick={() => alert('Spatial & Spec Vector Scan executed across 142 proposals.')}>
            Run Full Vector Scan
          </Button>
        </div>
      </div>

      {/* Action Toast Notification */}
      {actionNotice && (
        <div className="p-space-sm bg-emerald-50 border border-emerald-200 text-emerald-900 text-body-sm rounded flex items-center justify-between animate-fadeIn">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <StatCard
          title="Proposals Scanned"
          value="142"
          subtitle="FY 2026-27 Submissions"
          icon={CopyCheck}
        />
        <StatCard
          title="Potential Duplicates Flagged"
          value="8 Pairs"
          subtitle=">80% Similarity Score"
          badgeText="HIGH CONFIDENCE"
          badgeType="critical"
          icon={ShieldAlert}
        />
        <StatCard
          title="Prevented Double Allocation"
          value="₹1.85 Cr"
          subtitle="Estimated fiscal savings"
          badgeText="SAVINGS"
          badgeType="success"
          icon={CheckCircle2}
        />
      </div>

      {/* Duplicate Pairs Comparison List */}
      <div className="space-y-space-md">
        <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface">
          Flagged Duplicate Match Clusters
        </h3>

        {pairs.map((pair) => (
          <div
            key={pair.id}
            className="bg-surface-container-lowest border border-surface-container-high rounded p-space-md shadow-sm space-y-space-md hover:border-outline-variant transition-colors"
          >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-sm">
                <span className="font-mono font-bold text-headline-sm text-primary">{pair.id}</span>
                <StatusBadge type="CRITICAL" status={`${pair.similarityScore}% VECTOR MATCH`} />
                <span className="text-label-sm text-on-surface-variant font-mono">
                  Distance: {pair.vectorBreakdown.spatialDistance}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedPair(pair)}
                >
                  View Side-by-Side Details
                </Button>
              </div>
            </div>

            {/* Side by Side Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Proposal A (New MP Rec) */}
              <div className="p-space-md bg-surface-container-low border border-surface-container-high rounded space-y-2">
                <div className="flex items-center justify-between text-label-sm">
                  <span className="px-2 py-0.5 bg-primary text-on-primary rounded font-bold uppercase">
                    PROPOSAL A (NEW RECOMMENDATION)
                  </span>
                  <span className="font-mono font-semibold text-primary">{pair.proposalA.id}</span>
                </div>
                <h4 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  {pair.proposalA.title}
                </h4>
                <div className="text-body-sm text-on-surface-variant">
                  Source: <strong className="text-on-surface">{pair.proposalA.source}</strong>
                </div>
                <div className="text-body-sm text-on-surface-variant">
                  Agency: <strong className="text-on-surface">{pair.proposalA.agency}</strong>
                </div>
                <div className="text-body-sm text-on-surface-variant font-mono">
                  Cost: <strong className="text-error font-bold">{pair.proposalA.cost}</strong>
                </div>
                <p className="text-body-sm text-on-surface-variant pt-1 border-t border-surface-container-high">
                  {pair.proposalA.specSummary}
                </p>
              </div>

              {/* Proposal B (Existing Work) */}
              <div className="p-space-md bg-surface-container-low border border-surface-container-high rounded space-y-2">
                <div className="flex items-center justify-between text-label-sm">
                  <span className="px-2 py-0.5 bg-neutral-700 text-white rounded font-bold uppercase">
                    PROPOSAL B (EXISTING SANCTIONED WORK)
                  </span>
                  <span className="font-mono font-semibold text-primary">{pair.proposalB.id}</span>
                </div>
                <h4 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  {pair.proposalB.title}
                </h4>
                <div className="text-body-sm text-on-surface-variant">
                  Source: <strong className="text-on-surface">{pair.proposalB.source}</strong>
                </div>
                <div className="text-body-sm text-on-surface-variant">
                  Agency: <strong className="text-on-surface">{pair.proposalB.agency}</strong>
                </div>
                <div className="text-body-sm text-on-surface-variant font-mono">
                  Cost: <strong className="text-on-surface font-bold">{pair.proposalB.cost}</strong>
                </div>
                <p className="text-body-sm text-on-surface-variant pt-1 border-t border-surface-container-high">
                  {pair.proposalB.specSummary}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-space-sm border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-space-sm">
              <div className="text-label-sm text-on-surface-variant">
                Vector Match Breakdown: Textual <strong className="text-on-surface">{pair.vectorBreakdown.textualSimilarity}</strong> • BOQ Overlap <strong className="text-on-surface">{pair.vectorBreakdown.boqOverlap}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  icon={X}
                  onClick={() => handleAction(pair.id, 'REJECT_DUPLICATE')}
                >
                  Reject Proposal A (Duplicate)
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  icon={Check}
                  onClick={() => handleAction(pair.id, 'CONFIRM_DISTINCT')}
                >
                  Confirm Distinct Project
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side by Side Modal */}
      {selectedPair && (
        <Modal
          isOpen={!!selectedPair}
          onClose={() => setSelectedPair(null)}
          title={`Forensic Comparison: ${selectedPair.id}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-body-sm">
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded font-semibold text-center">
              AI Recommendation: High 94% Vector Similarity — Duplicate detected between Proposal A (MP Recommendation) and Proposal B (State PWD Scheme).
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-3 border rounded bg-surface">
                <h5 className="font-bold text-headline-sm text-on-surface">{selectedPair.proposalA.title}</h5>
                <p className="text-label-sm font-mono">{selectedPair.proposalA.location}</p>
                <p className="text-body-sm text-on-surface-variant">{selectedPair.proposalA.specSummary}</p>
              </div>
              <div className="space-y-2 p-3 border rounded bg-surface">
                <h5 className="font-bold text-headline-sm text-on-surface">{selectedPair.proposalB.title}</h5>
                <p className="text-label-sm font-mono">{selectedPair.proposalB.location}</p>
                <p className="text-body-sm text-on-surface-variant">{selectedPair.proposalB.specSummary}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
