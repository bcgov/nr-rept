import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from 'react';

import {
  KC_IDP_HINT,
  ensureFreshUser,
  forceRenew,
  getUserManager,
  loadStoredUser,
} from '@/services/keycloak';

import { AuthContext, type AuthContextType } from './AuthContext';
import { parseToken, type KeycloakProfile } from './authUtils';
import { type FamLoginUser } from './types';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FamLoginUser | undefined>(undefined);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Guards against two near-simultaneous API calls each starting their own
  // renewal. A ref, because changing it must not re-render.
  const renewInFlight = useRef<Promise<string | undefined> | null>(null);

  /** Publishes a signed-in session, or clears it when the user is gone. */
  const applyUser = useCallback((oidcUser: { access_token?: string; profile?: unknown } | null) => {
    if (!oidcUser?.access_token) {
      setUser(undefined);
      setAccessToken(undefined);
      return undefined;
    }
    setAccessToken(oidcUser.access_token);
    const parsed = parseToken(oidcUser.profile as KeycloakProfile);
    setUser(parsed);
    return oidcUser.access_token;
  }, []);

  // ── Initial session bootstrap ──────────────────────────────────────
  // Users without any recognized REPT role are kept in state (isLoggedIn=true)
  // so the routing layer can send them to /unauthorized via getNoRoleRoutes().
  // Signing them out here would bounce them through Keycloak and they'd land on
  // a public path the public route table doesn't cover, falling through to the
  // NotFound catch-all.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const restored = await loadStoredUser(getUserManager());
        if (!cancelled) applyUser(restored);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[AuthProvider] error loading user:', error);
        if (!cancelled) applyUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  // ── Auth actions ───────────────────────────────────────────────────

  const login = useCallback(() => {
    void getUserManager().signinRedirect({ extraQueryParams: { kc_idp_hint: KC_IDP_HINT } });
  }, []);

  /**
   * Ends the Keycloak session.
   *
   * **The stored user is deliberately left in place.** oidc-client-ts reads
   * `id_token_hint` off it and removes it itself; clearing the tokens first
   * sends a logout Keycloak cannot attribute to a session, so the realm session
   * survives and the next sign-in walks straight back in without a prompt —
   * which is exactly what "logout doesn't work" looks like from the outside.
   * (The Cognito implementation cleared tokens up front because it drove the
   * federated redirect chain by hand; that whole chain is gone.)
   *
   * **And it always finishes.** Every caller invokes this as `void logout()`, so
   * a redirect that throws — a silent renewal having already removed the stored
   * user, Keycloak refusing the request — would reject into nothing and leave
   * the app showing a signed-out page on top of a live realm session. The catch
   * drops this browser's tokens and lands on the sign-in screen under our own
   * steam instead.
   */
  const logout = useCallback(async () => {
    try {
      await getUserManager().signoutRedirect();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[AuthProvider] sign-out redirect failed; clearing locally.', error);
      await getUserManager()
        .removeUser()
        .catch(() => undefined);
      applyUser(null);
      window.location.assign(import.meta.env.BASE_URL || '/');
    }
  }, [applyUser]);

  const userToken = useCallback((): string | undefined => accessToken, [accessToken]);

  /**
   * Returns a usable access token, renewing first if it is at or near expiry.
   *
   * Called before each API request (headers.ts / APIs.ts) and, throttled, on
   * user activity by the idle guard. A no-op unless the token is nearly out, so
   * it is cheap to call often.
   *
   * Concurrent callers share one renewal rather than each starting their own:
   * every `signinSilent` rotates the refresh token, and racing rotations against
   * each other is how a session dies while somebody is using it.
   */
  const ensureFreshToken = useCallback(async (): Promise<string | undefined> => {
    if (renewInFlight.current) {
      return renewInFlight.current;
    }

    const attempt = (async () => {
      try {
        const fresh = await ensureFreshUser(getUserManager());
        return applyUser(fresh);
      } catch (error) {
        // The refresh token is gone or was refused — the session is over.
        // eslint-disable-next-line no-console
        console.warn('[AuthProvider] Session expired — signing out.', error);
        applyUser(null);
        void logout();
        return undefined;
      } finally {
        renewInFlight.current = null;
      }
    })();

    renewInFlight.current = attempt;
    return attempt;
  }, [applyUser, logout]);

  /**
   * Unconditional renewal, backing the timeout dialog's "Stay logged in".
   *
   * Unlike {@link ensureFreshToken} this renews however much life the access
   * token has left, because the point is the refresh token behind it: using it
   * rotates it, which is what actually moves the thirty-minute ceiling and buys
   * the extra time the button promises. Throws when the refresh token has
   * already expired — the caller then treats it as a real expiry.
   */
  const forceRefreshSession = useCallback(async (): Promise<void> => {
    const renewed = await forceRenew(getUserManager());
    applyUser(renewed);
  }, [applyUser]);

  /** Completes the redirect back from Keycloak. Used only by AuthCallback. */
  const completeLogin = useCallback(async (): Promise<void> => {
    const signedIn = await getUserManager().signinRedirectCallback();
    applyUser(signedIn);
  }, [applyUser]);

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      userToken,
      ensureFreshToken,
      forceRefreshSession,
      completeLogin,
    }),
    [
      user,
      isLoading,
      login,
      logout,
      userToken,
      ensureFreshToken,
      forceRefreshSession,
      completeLogin,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
