import { fetchAuthSession } from 'aws-amplify/auth';

import { env } from '@/env';
import { UserService } from '@/services/users.service';

import type { APIConfig } from '@/config/api/types';

// Strip a trailing '/' so VITE_BASE_PATH='/' produces '/api' (not '//api',
// which the browser parses as scheme-relative → https://api/...).
const basePath = (env.VITE_BASE_PATH ?? '').replace(/\/$/, '');

// Central API configuration shared by all service classes.
//
// TOKEN is sourced from Amplify's auth session rather than parsing document.cookie
// directly. This works regardless of where the configured token storage (cookies,
// localStorage, etc.) actually lands — Amplify reads from its own storage and
// returns the current accessToken. Refreshes on every request so a stale token
// from an expired session isn't sent.
export const BackendApiConfig: APIConfig = {
  BASE: env.VITE_BACKEND_URL || `${basePath}/api`,
  VERSION: '0',
  WITH_CREDENTIALS: true,
  CREDENTIALS: 'include',
  TOKEN: undefined,
  USERNAME: undefined,
  PASSWORD: undefined,
  HEADERS: undefined,
  ENCODE_PATH: undefined,
};

BackendApiConfig.TOKEN = async () => {
  try {
    const { tokens } = (await fetchAuthSession()) ?? {};
    return tokens?.accessToken?.toString() ?? '';
  } catch {
    return '';
  }
};

// Register all services here
const serviceConstructors = {
  user: new UserService(BackendApiConfig),
} as const;

type ExternalApiType = {
  [K in keyof typeof serviceConstructors]: (typeof serviceConstructors)[K];
};

const API: ExternalApiType = serviceConstructors;

export default API;
