import { fetchAuthSession, signInWithRedirect, signOut } from 'aws-amplify/auth';
import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';

import { env } from '@/env';

import { AuthContext, type AuthContextType } from './AuthContext';
import { parseToken, getAccessTokenFromCookie } from './authUtils';
import { type FamLoginUser, AVAILABLE_ROLES } from './types';

/**
 * Seconds before access-token expiry at which we consider it "stale" and
 * force a refresh on the next API call.  Keeps a small buffer so the token
 * is still valid by the time the request reaches the server.
 */
const REFRESH_MARGIN_SECONDS = 30;

/**
 * Minimum gap (ms) between two consecutive refresh attempts.
 * Prevents multiple near-simultaneous API calls from each triggering
 * their own refresh.
 */
const MIN_REFRESH_GAP_MS = 5_000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FamLoginUser | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const appEnv = isNaN(Number(env.VITE_ZONE)) ? (env.VITE_ZONE ?? 'TEST') : 'TEST';

  // Track whether a refresh is already in flight to avoid concurrent calls.
  const refreshInFlight = useRef(false);
  const lastRefreshTime = useRef(0);

  // ── Core session loader ────────────────────────────────────────────
  const loadSession = useCallback(
    async (forceRefresh = false): Promise<FamLoginUser | undefined> => {
      const { tokens } = (await fetchAuthSession({ forceRefresh })) ?? {};
      const idToken = tokens?.idToken;
      if (!idToken) return undefined;

      return parseToken(idToken);
    },
    [],
  );

  // ── Initial session bootstrap + user state ─────────────────────────
  const refreshUserState = useCallback(async () => {
    setIsLoading(true);
    try {
      const parsed = await loadSession(false);

      if (parsed && (!parsed.roles || parsed.roles.length === 0)) {
        // eslint-disable-next-line no-console
        console.warn(
          '[AuthProvider] User has no recognized role — logging out.',
          'cognito:groups did not contain any of:',
          AVAILABLE_ROLES,
        );
        await signOut();
        setUser(undefined);
        return;
      }

      setUser(parsed);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[AuthProvider] error loading user:', error);
      setUser(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [loadSession]);

  // Bootstrap on mount.
  useEffect(() => {
    refreshUserState();
  }, [refreshUserState]);

  // ── On-demand token refresh ────────────────────────────────────────
  // Called before each API request (from ensureFreshToken / headers.ts).
  // Checks the access token's `exp` claim; if it's about to expire,
  // forces a refresh via the refresh token.
  //
  // If the refresh token has also expired, Amplify will throw and we
  // sign the user out and redirect to login.
  //
  // NO background interval — the token is only refreshed when the user
  // actually makes an API call, so idle users will naturally time out
  // once the refresh token expires.
  const ensureFreshToken = useCallback(async (): Promise<string | undefined> => {
    try {
      // First, check if current access token is still fresh enough
      const { tokens } = (await fetchAuthSession({ forceRefresh: false })) ?? {};
      const accessToken = tokens?.accessToken;

      if (!accessToken) {
        // No session at all — user needs to log in
        await signOut();
        setUser(undefined);
        return undefined;
      }

      const exp = accessToken.payload?.exp;
      if (!exp) {
        return accessToken.toString();
      }

      const secondsRemaining = exp - Math.floor(Date.now() / 1000);

      if (secondsRemaining > REFRESH_MARGIN_SECONDS) {
        // Token is still fresh — return it as-is
        return accessToken.toString();
      }

      // Token is stale or expired — need to refresh
      if (refreshInFlight.current) {
        // Another refresh is already happening; wait a moment and read from cookie
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return getAccessTokenFromCookie();
      }

      const now = Date.now();
      if (now - lastRefreshTime.current < MIN_REFRESH_GAP_MS) {
        // Recently refreshed — just return what's in the cookie
        return getAccessTokenFromCookie();
      }

      refreshInFlight.current = true;
      lastRefreshTime.current = now;

      try {
        const parsed = await loadSession(true);
        if (parsed) {
          setUser(parsed);
        }
        return getAccessTokenFromCookie();
      } finally {
        refreshInFlight.current = false;
      }
    } catch (error) {
      // Refresh token is expired or invalid — session is over
      // eslint-disable-next-line no-console
      console.warn('[AuthProvider] Session expired — signing out.', error);
      refreshInFlight.current = false;
      await signOut();
      setUser(undefined);
      return undefined;
    }
  }, [loadSession]);

  // ── Auth actions ───────────────────────────────────────────────────

  const login = useCallback(async () => {
    signInWithRedirect({
      provider: { custom: `${appEnv.toUpperCase()}-IDIR` },
    });
  }, [appEnv]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(undefined);
  }, []);

  const userToken = useCallback((): string | undefined => {
    return getAccessTokenFromCookie();
  }, []);

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      userToken,
      ensureFreshToken,
    }),
    [user, isLoading, login, logout, userToken, ensureFreshToken],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
