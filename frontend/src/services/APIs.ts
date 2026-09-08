import { env } from '@/env';
import { ensureFreshUser, getUserManager } from '@/services/keycloak';
import { UserService } from '@/services/users.service';

import type { APIConfig } from '@/config/api/types';

// Strip a trailing '/' so VITE_BASE_PATH='/' produces '/api' (not '//api',
// which the browser parses as scheme-relative → https://api/...).
const basePath = (env.VITE_BASE_PATH ?? '').replace(/\/$/, '');

// Central API configuration shared by all service classes.
//
// TOKEN comes from the OIDC UserManager rather than from document.cookie: tokens
// live in sessionStorage now, and the manager is the only thing that knows
// whether the stored one is still good. Checked per request — with a five-minute
// access token, a stale one is a live possibility rather than an edge case.
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
    const user = await ensureFreshUser(getUserManager());
    return user?.access_token ?? '';
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
