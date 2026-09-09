import { createContext, type ReactNode } from 'react';

import type { FamLoginUser } from './types';

export type AuthContextType = {
  user: FamLoginUser | undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  userToken: () => string | undefined;
  /** Checks the access token expiry and refreshes via the refresh token if
   *  needed. Returns the current access token string, or undefined if the
   *  session has expired (user will be signed out automatically). */
  ensureFreshToken: () => Promise<string | undefined>;
  /**
   * Force a token refresh via the refresh token (mints a fresh, rotated
   * refresh token, sliding the session deadline). Backs the SessionTimeout
   * warning modal's "Stay logged in". Rejects if the refresh token itself has
   * expired — the caller then treats it as a real expiry and signs out.
   */
  forceRefreshSession: () => Promise<void>;
  /**
   * Completes the authorization-code exchange after Keycloak redirects back.
   * Called only by the /authCallback route; rejects if the callback URL carries
   * no usable code or its state has already been consumed.
   */
  completeLogin: () => Promise<void>;
};

export type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
