/**
 * Unified Data Service for MPLADS-Sentinel
 *
 * Bridges the existing frontend UI with the live backend API and ML models.
 * Provides both:
 * 1. Async fetch methods (`fetch*`) calling the live backend with automatic adapter translation
 * 2. Synchronous fallback getters (`get*`) using cached live data or fallback mockData
 */

import * as projectsApi from './api/projects.js';
import * as summaryApi from './api/summary.js';
import * as duplicatesApi from './api/duplicates.js';
import * as alertsApi from './api/alerts.js';
import * as risksApi from './api/risks.js';
import * as benfordApi from "./api/benford";

import {
  adaptProjectItem,
  adaptProjectsList,
  adaptProjectDetail,
  adaptMinistryStats,
  adaptStatePerformance,
  adaptDuplicatePairs,
  adaptTier2Digest,
  adaptCostAnomalies,
  adaptAnomalyCategories,
} from '../adapters/backendAdapter.js';

import {
  MINISTRY_STATS,
  STATE_PERFORMANCE_DATA,
  TOP_ANOMALY_CATEGORIES,
  TIER2_DIGEST_DATA,
  BENFORD_ANALYSIS_DATA,
  DISTRICT_VARANASI_DATA,
  PROJECTS_LIST,
  DUPLICATE_DETECTION_PAIRS,
  COST_ANOMALIES_BOQ,
  AUDIT_LOGS_DATA,
  INVESTIGATION_DETAIL_PRJ089,
} from '../data/mockData.js';

// In-memory runtime cache populated whenever live API calls succeed
const cache = {
  ministryStats: null,
  statePerformance: null,
  tier2Digest: null,
  projects: null,
  duplicates: null,
  costAnomalies: null,
  projectDetails: new Map(),
};

export const dataService = {
  // ==========================================
  // ASYNC LIVE BACKEND API METHODS (WITH ADAPTERS)
  // ==========================================

  /**
   * Fetch complete live dataset for National Overview dashboard.
   */
  fetchNationalOverviewData: async () => {
    const [summaryRes, mpsRes, alertsRes, projectsRes, dupsRes] = await Promise.all([
      summaryApi.getSummary().catch((err) => {
        console.error('[dataService] summaryApi.getSummary failed:', err);
        throw err;
      }),
      summaryApi.getMpSummaries().catch(() => ({ data: [] })),
      alertsApi.getTier2Digest().catch(() => ({ alerts: [], count: 0 })),
      projectsApi.getProjects({ page_size: 5000 }).catch(() => ({ projects: [], total: 0 })),
      duplicatesApi.getDuplicates({ page_size: 1 }).catch(() => ({ duplicates: [], total: 0 })),
    ]);

    const stats = adaptMinistryStats(summaryRes, mpsRes, projectsRes);
    const statePerformance = adaptStatePerformance(mpsRes);
    const anomalyCategories = adaptAnomalyCategories(alertsRes, dupsRes);
    const tier2Digest = adaptTier2Digest(alertsRes);

    cache.ministryStats = stats;
    cache.statePerformance = statePerformance;
    cache.tier2Digest = tier2Digest;

    return {
      stats,
      statePerformance,
      anomalyCategories,
      tier2Digest,
      topAlert: alertsRes.alerts?.[0] || null,
    };
  },
 async getBenfordAnalysis() {
    return await benfordApi.getAnalysis();
  },
  /**
   * Fetch live national ministry overview stats.
   */
  fetchMinistryStats: async () => {
    try {
      const [summaryRes, mpsRes] = await Promise.all([
        summaryApi.getSummary(),
        summaryApi.getMpSummaries().catch(() => null),
      ]);
      const adapted = adaptMinistryStats(summaryRes, mpsRes);
      cache.ministryStats = adapted;
      return adapted;
    } catch (error) {
      console.warn('[dataService] fetchMinistryStats failed, using fallback:', error.message);
      return cache.ministryStats || MINISTRY_STATS;
    }
  },
  /**
 * Fetch live district overview dashboard data.
 * Adapts /summary into the object expected by the existing UI.
 */
fetchDistrictOverview: async () => {
  try {
    const summaryRes = await summaryApi.getSummary();
    console.log(summaryRes);
    const s = summaryRes.data;

    return {
      collectorName: "District Collector",
      districtName: "Punjab",
      state: "Punjab",

      totalAllocation: "₹147 Cr",
      sanctionedDisbursed: `${Math.round(
        (s.completed_projects / s.total_projects) * 100
      )}%`,
      activeWorks: s.total_projects,
      pendingAlertsCount: s.tier_counts.tier2,

      workStages: [
        {
          stage: "Recommended",
          count: s.recommended_projects,
          amount: "—",
        },
        {
          stage: "In Progress",
          count: s.in_progress_projects,
          amount: "—",
        },
        {
          stage: "Completed",
          count: s.completed_projects,
          amount: "—",
        },
        {
          stage: "Tier 1",
          count: s.tier_counts.tier1,
          amount: "—",
        },
        {
          stage: "Tier 2",
          count: s.tier_counts.tier2,
          amount: "—",
        },
      ],

      // Placeholder until analytics endpoint exists
      sectorAllocation: [],
      monthlyDisbursement: [],
    };
  } catch (err) {
    console.error("[dataService] fetchDistrictOverview failed:", err);
    return DISTRICT_VARANASI_DATA;
  }
},
  /**
   * Fetch live state/constituency performance table.
   */
  fetchStatePerformance: async (searchQuery = '') => {
    try {
      const mpsRes = await summaryApi.getMpSummaries();
      const adapted = adaptStatePerformance(mpsRes);
      if (adapted && adapted.length > 0) {
        cache.statePerformance = adapted;
      }
      const data = adapted && adapted.length > 0 ? adapted : cache.statePerformance || STATE_PERFORMANCE_DATA;
      if (!searchQuery) return data;
      const q = searchQuery.toLowerCase();
      return data.filter(
        (item) => item.state.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      );
    } catch (error) {
      console.warn('[dataService] fetchStatePerformance failed, using fallback:', error.message);
      const fallback = cache.statePerformance || STATE_PERFORMANCE_DATA;
      if (!searchQuery) return fallback;
      const q = searchQuery.toLowerCase();
      return fallback.filter(
        (item) => item.state.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      );
    }
  },

  /**
   * Fetch live Tier-2 actionable anomaly digest.
   */
  fetchTier2Digest: async () => {
    try {
      const digestRes = await alertsApi.getTier2Digest();
      const adapted = adaptTier2Digest(digestRes);
      cache.tier2Digest = adapted;
      return adapted;
    } catch (error) {
      console.warn('[dataService] fetchTier2Digest failed, using fallback:', error.message);
      return cache.tier2Digest || TIER2_DIGEST_DATA;
    }
  },

  /**
   * Fetch live projects list with filters and backend search.
   */
  fetchProjects: async (filters = {}) => {
    try {
      const params = {
        page: filters.page || 1,
        page_size: filters.pageSize || 50,
      };

      if (filters.search) {
        params.category = filters.search;
      }
      if (filters.sector && filters.sector !== 'ALL') {
        params.category = filters.sector;
      }
      if (filters.risk && filters.risk !== 'ALL') {
        if (filters.risk.includes('CRITICAL')) params.risk_tier = 'TIER_2';
        else if (filters.risk.includes('HIGH')) params.risk_tier = 'TIER_1';
      }
      if (filters.mp) {
        params.mp = filters.mp;
      }
      if (filters.sort) {
        params.sort = filters.sort;
      }

      const res = await projectsApi.getProjects(params);
      const adapted = adaptProjectsList(res.projects || []);
      if (adapted && adapted.length > 0) {
        cache.projects = adapted;
      }
      return adapted;
    } catch (error) {
      console.warn('[dataService] fetchProjects failed, using fallback:', error.message);
      return dataService.getProjects(filters);
    }
  },

  /**
   * Fetch live single project forensic details.
   */
  fetchProjectById: async (id) => {
    try {
      // Extract numeric work_id if formatted string like 'PRJ-2026-WORK-1718' or '1718'
      const cleanId = String(id || '').replace(/^PRJ-2026-.*?-/i, '').replace(/\D+/g, '') || id;
      const workId = parseInt(cleanId, 10);

      if (!workId || isNaN(workId)) {
        return dataService.getProjectById(id);
      }

      const res = await projectsApi.getProjectById(workId);
      const adapted = adaptProjectDetail(res);
      if (adapted) {
        cache.projectDetails.set(String(id), adapted);
        cache.projectDetails.set(String(workId), adapted);
      }
      return adapted;
    } catch (error) {
      console.warn('[dataService] fetchProjectById failed, using fallback:', error.message);
      return dataService.getProjectById(id);
    }
  },

  /**
   * Fetch live duplicate candidate pairs.
   */
  fetchDuplicateDetectionPairs: async (params = {}) => {
    try {
      const res = await duplicatesApi.getDuplicates({ page_size: 20, ...params });
      const adapted = adaptDuplicatePairs(res);
      if (adapted && adapted.length > 0) {
        cache.duplicates = adapted;
      }
      return adapted;
    } catch (error) {
      console.warn('[dataService] fetchDuplicateDetectionPairs failed, using fallback:', error.message);
      return cache.duplicates || DUPLICATE_DETECTION_PAIRS;
    }
  },

  /**
   * Fetch live cost anomaly items for BOQ radar.
   */
  fetchCostAnomaliesBOQ: async () => {
    try {
      const res = await risksApi.getCostAnomalies({ page_size: 20 });
      const adapted = adaptCostAnomalies(res);
      if (adapted && adapted.length > 0) {
        cache.costAnomalies = adapted;
      }
      return adapted;
    } catch (error) {
      console.warn('[dataService] fetchCostAnomaliesBOQ failed, using fallback:', error.message);
      return cache.costAnomalies || COST_ANOMALIES_BOQ;
    }
  },

  // ==========================================
  // SYNCHRONOUS GETTERS (PRESERVES UI COMPATIBILITY)
  // ==========================================

  getMinistryStats: () => cache.ministryStats || MINISTRY_STATS,

  getStatePerformance: (searchQuery = '') => {
    const data = cache.statePerformance || STATE_PERFORMANCE_DATA;
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) => item.state.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
    );
  },

  getTopAnomalyCategories: () => TOP_ANOMALY_CATEGORIES,

  getTier2Digest: () => cache.tier2Digest || TIER2_DIGEST_DATA,

  getBenfordAnalysis: () => benfordApi.getAnalysis(),

  getDistrictOverview: () => DISTRICT_VARANASI_DATA,

  getDuplicateDetectionPairs: () => cache.duplicates || DUPLICATE_DETECTION_PAIRS,

  getCostAnomaliesBOQ: () => cache.costAnomalies || COST_ANOMALIES_BOQ,

  getAuditLogs: ({ search = '', severity = 'ALL' } = {}) => {
    const query = search.trim().toLowerCase();
    return AUDIT_LOGS_DATA.filter((log) => {
      const matchesSeverity = severity === 'ALL' || log.severity === severity;
      const matchesSearch =
        !query ||
        [
          log.id,
          log.user,
          log.role,
          log.action,
          log.targetEntity,
          log.ipAddress,
          log.details,
        ].some((value) => value.toLowerCase().includes(query));

      return matchesSeverity && matchesSearch;
    });
  },

  getProjects: (filters = {}) => {
    let result = cache.projects && cache.projects.length > 0 ? [...cache.projects] : [...PROJECTS_LIST];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.sector && p.sector.toLowerCase().includes(q))
      );
    }
    if (filters.sector && filters.sector !== 'ALL') {
      result = result.filter(
        (p) => p.sector && p.sector.toLowerCase().includes(filters.sector.toLowerCase())
      );
    }
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters.risk && filters.risk !== 'ALL') {
      result = result.filter((p) => p.riskLevel && p.riskLevel.includes(filters.risk));
    }
    return result;
  },

  getProjectById: (id) => {
    const key = String(id || '');
    if (cache.projectDetails.has(key)) {
      return cache.projectDetails.get(key);
    }

    if (id === 'PRJ-2026-VAR-089' || !id) {
      return INVESTIGATION_DETAIL_PRJ089;
    }

    const found = (cache.projects || PROJECTS_LIST).find((p) => p.id === id);
    if (found) {
      const isCritical = found.riskLevel.includes('CRITICAL');
      const isHigh = found.riskLevel.includes('HIGH');
      const isMod = found.riskLevel.includes('MODERATE');

      return {
        project: found,
        forensicSummary: {
          overallRiskScore: isCritical
            ? '9.4 / 10 (CRITICAL)'
            : isHigh
            ? '7.8 / 10 (HIGH)'
            : isMod
            ? '4.5 / 10 (MODERATE)'
            : '1.2 / 10 (LOW)',
          anomalyFlags: [
            found.anomalyType !== 'None' ? found.anomalyType : 'Routine Administrative Monitoring',
            isCritical
              ? 'BOQ Schedule of Rates Variance >35%'
              : isHigh
              ? 'Single Bidder Contract Award Pattern'
              : 'Normal Specification Parameters',
          ],
          financialExposure: found.sanctionedAmount,
          recommendedAction: isCritical
            ? 'Freeze Tranche 2 & Issue Show-Cause Notice'
            : isHigh
            ? 'Request BOQ Line Item Justification from Executing Agency'
            : 'Approve Regular Progress Milestone Disbursement',
        },
        milestonesTimeline: [
          {
            title: 'MP Recommendation Received',
            date: found.dateRecommended,
            status: 'COMPLETED',
            verifiedBy: 'MP Secretariat',
          },
          {
            title: 'Technical & Financial Sanction Issued',
            date: found.dateSanctioned,
            status: 'COMPLETED',
            verifiedBy: 'District Authority',
          },
          {
            title: 'Contract Awarded',
            date: '2026-06-15',
            status: 'COMPLETED',
            verifiedBy: found.executingAgency,
          },
          {
            title: 'Work Execution & Progress Review',
            date: '2026-08-01',
            status: found.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
            amount: found.disbursedAmount,
          },
          {
            title: 'Target Completion Date',
            date: found.completionTarget,
            status: found.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          },
        ],
        contractorInfo: {
          companyName: found.executingAgency,
          gstin: `09AAACS${found.id.slice(-3)}1Z8`,
          pan: `AAACS${found.id.slice(-3)}F`,
          registeredAddress: `${found.location}, Varanasi District, Uttar Pradesh`,
          totalMPLADSShare: isCritical ? '42% of Sector Work Share' : '15% Sector Work Share',
          riskRating: isCritical ? 'HIGH RISK VENDOR' : isHigh ? 'MODERATE RISK VENDOR' : 'OPERATIONAL VENDOR',
        },
        boqBreakdown: [
          {
            itemDescription: `Primary Civil & Equipment Material for ${found.title}`,
            claimedRate: isCritical ? '₹6,800 / Cum' : '₹4,900 / Cum',
            benchmarkRate: '₹4,900 / Cum',
            variance: isCritical ? '+38.8%' : '0.0%',
            contractor: found.executingAgency,
          },
        ],
      };
    }

    return {
      project: {
        id: id || 'PRJ-2026-VAR-000',
        title: `Infrastructure Work (${id})`,
        mpName: 'Shri Narendra Modi',
        constituency: 'Varanasi',
        sector: 'General Development',
        sanctionedAmount: '₹30,00,000',
        estimatedCost: '₹30,00,000',
        disbursedAmount: '₹15,00,000',
        status: 'IN EXECUTION',
        riskLevel: 'MODERATE RISK',
        executingAgency: 'District Rural Dev Agency',
        location: 'Varanasi District',
        dateRecommended: '2026-04-01',
        dateSanctioned: '2026-05-01',
        completionTarget: '2026-12-31',
        anomalyType: 'Standard Audit Review',
        similarityScore: '15%',
      },
      forensicSummary: {
        overallRiskScore: '4.5 / 10 (MODERATE)',
        anomalyFlags: ['Standard Audit Review'],
        financialExposure: '₹30,00,000',
        recommendedAction: 'Routine Quarterly Milestone Inspection',
      },
      milestonesTimeline: INVESTIGATION_DETAIL_PRJ089.milestonesTimeline,
      contractorInfo: INVESTIGATION_DETAIL_PRJ089.contractorInfo,
      boqBreakdown: [],
    };
  },
  async fetchBenfordAnalysis() {
  return api.benford.getAnalysis();
}
};
