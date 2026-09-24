/**
 * Duplicates API Service
 * Handles candidate duplicate proposal pairs identified by AI vector matching.
 */

import { apiClient } from './client.js';

/**
 * Fetch candidate duplicate pairs.
 *
 * Supported params:
 * - min_score: number (0 - 100)
 * - page: number
 * - page_size: number (1 - 100)
 */
export async function getDuplicates(params = {}) {
  return apiClient('/duplicates', { params });
}
