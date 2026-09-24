/**
 * Centralized API client for MPLADS-Sentinel
 * Handles base URL configuration, request timeouts, headers, and uniform error handling.
 */

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:4000/api';

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Builds query string from an object, omitting null/undefined/empty string values.
 */
function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const str = query.toString();
  return str ? `?${str}` : '';
}

/**
 * Core request helper with timeout and standardized error handling.
 */
export async function apiClient(endpoint, options = {}) {
  const { params, timeout = DEFAULT_TIMEOUT_MS, headers = {}, ...customConfig } = options;
  const queryString = params ? buildQueryString(params) : '';
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}${queryString}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    signal: controller.signal,
    ...customConfig,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      const message = (errorData && errorData.error) || `HTTP error ${response.status}: ${response.statusText}`;
      throw new ApiError(message, response.status, errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(`Request to ${endpoint} timed out after ${timeout}ms`, 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network / connection error
    throw new ApiError(error.message || 'Network connection failed', 0);
  }
}

export { API_BASE_URL };
