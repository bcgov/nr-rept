import { getAccessTokenFromCookie } from '@/context/auth/authUtils';
import { env } from '@/env';
import { UserService } from '@/services/users.service';

import type { APIConfig } from '@/config/api/types';

// Central API configuration shared by all service classes.
// The TOKEN getter refreshes the Cognito accessToken from cookies on every request.
export const BackendApiConfig: APIConfig = {
  BASE: env.VITE_BACKEND_URL || `${env.VITE_BASE_PATH || '/pub/rept'}/api`,
  VERSION: '0',
  WITH_CREDENTIALS: true,
  CREDENTIALS: 'include',
  TOKEN: getAccessTokenFromCookie(),
  USERNAME: undefined,
  PASSWORD: undefined,
  HEADERS: undefined,
  ENCODE_PATH: undefined,
};

BackendApiConfig.TOKEN = async () => {
  return getAccessTokenFromCookie() ?? '';
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
