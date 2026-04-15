/**
 * API Configuration
 * Provides flexible backend URL handling for different environments
 */

const getApiBaseUrl = () => {
  // Check for environment variable first (for Vite)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Development: assume backend on localhost:3001
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }

  // Production: use same origin as frontend (backend served from same domain)
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  analysis: `${API_BASE_URL}/api/analysis`,
  analysisReport: `${API_BASE_URL}/api/analysis/report`,
  analysisSummary: `${API_BASE_URL}/api/analysis/summary`,
  analysisFull: `${API_BASE_URL}/api/analysis/full`,
};

export default API_ENDPOINTS;
