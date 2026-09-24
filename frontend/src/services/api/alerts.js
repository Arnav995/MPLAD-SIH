/**
 * Alerts & Tier-2 Digest API Service
 * Handles actionable high-risk escalations and Tier-2 digest items.
 */

import { apiClient } from './client.js';

/**
 * Fetch all Tier-2 actionable anomaly alerts and digest items.
 */
export async function getTier2Digest() {
  return apiClient('/alerts/tier2-digest');
}
