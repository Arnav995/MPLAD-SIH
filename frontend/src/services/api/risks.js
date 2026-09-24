/**
 * Risk & Forensics API Service
 * Helper methods for querying specific risk categories, cost anomalies, and risk-stratified projects.
 */

import { getProjects } from './projects.js';

/**
 * Fetch projects flagged specifically for cost anomalies.
 */
export async function getCostAnomalies(params = {}) {
  return getProjects({
    signal_type: 'COST_ANOMALY',
    sort: 'risk_desc',
    ...params,
  });
}

/**
 * Fetch projects filtered by risk tier (TIER_2, TIER_1, CLEAN).
 */
export async function getProjectsByTier(tier, params = {}) {
  return getProjects({
    risk_tier: tier,
    ...params,
  });
}
