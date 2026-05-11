import { env } from '@/env';

// Resolved once at module load from runtime config (window.config) or Vite env.
const API_BASE_URL = env.VITE_BACKEND_URL || `${env.VITE_BASE_PATH || '/pub/rept'}/api`;

const normalizePath = (path: string) => {
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? path : `/${path}`;
};

export const getApiBaseUrl = (): string => API_BASE_URL;

export const buildApiUrl = (path = ''): string => `${API_BASE_URL}${normalizePath(path)}`;
