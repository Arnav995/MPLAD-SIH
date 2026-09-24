/**
 * Summary API Service
 * Handles aggregate statistics at national, district, and MP levels.
 */

import { apiClient } from './client.js';

/**
 * Fetch national summary statistics (total projects, stage breakdown, risk tier counts).
 */
export async function getSummary() {
  return apiClient('/summary');
}

/**
 * Fetch per-district aggregated summaries (project counts, average risk, tier breakdown).
 */
export async function getDistrictSummaries() {
  return apiClient('/summary/districts');
}

/**
 * Fetch per-MP aggregated summaries (project counts, average risk, tier breakdown).
 */
export async function getMpSummaries() {
  return apiClient('/summary/mps');
}
