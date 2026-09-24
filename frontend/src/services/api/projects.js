/**
 * Projects API Service
 * Handles fetching paginated project lists and forensic project details.
 */

import { apiClient } from './client.js';

/**
 * Fetch projects with optional filters.
 *
 * Supported params:
 * - district: string
 * - mp: string
 * - lifecycle_status: 'RECOMMENDED' | 'SANCTIONED' | 'IN_PROGRESS' | 'COMPLETED'
 * - risk_tier: 'TIER_2' | 'TIER_1' | 'CLEAN'
 * - min_risk_index: number
 * - category: string
 * - signal_type: 'COST_ANOMALY' | 'DUPLICATE_OVERLAP' | 'CROSS_STAGE_CONSISTENCY'
 * - signal_severity: 'LOW' | 'MEDIUM' | 'HIGH'
 * - page: number
 * - page_size: number
 * - sort: 'risk_asc' | 'risk_desc' | 'amount_asc' | 'amount_desc' | 'newest' | 'oldest'
 */
export async function getProjects(params = {}) {
  return apiClient('/projects', { params });
}

/**
 * Fetch single project forensic details by workId (integer ID).
 */
export async function getProjectById(workId) {
  if (!workId) {
    throw new Error('workId is required to fetch project details');
  }
  return apiClient(`/projects/${workId}`);
}
