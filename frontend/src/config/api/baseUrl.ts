import { env } from '@/env';

// Strip a trailing '/' so VITE_BASE_PATH='/' produces '/api' (not '//api',
// which the browser parses as scheme-relative → https://api/...).
const basePath = (env.VITE_BASE_PATH ?? '').replace(/\/$/, '');

// Resolved once at module load from runtime config (window.config) or Vite env.
const API_BASE_URL = env.VITE_BACKEND_URL || `${basePath}/api`;

const normalizePath = (path: string) => {
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? path : `/${path}`;
};

export const getApiBaseUrl = (): string => API_BASE_URL;

export const buildApiUrl = (path = ''): string => `${API_BASE_URL}${normalizePath(path)}`;
