import { env } from '@/env';

import {
  AVAILABLE_ROLES,
  validIdpProviders,
  type FamLoginUser,
  type IdpProviderType,
  type JWT,
  type ROLE_TYPE,
  type USER_PRIVILEGE_TYPE,
} from './types';

// ── Cookie helpers ───────────────────────────────────────────────────

/** Reads a browser cookie value by name. Returns '' if not found. */
export const getCookie = (name: string): string => {
  const cookie = document.cookie
    .split(';')
    .find((cookieValue) => cookieValue.trim().startsWith(name));
  return cookie ? (cookie.split('=')[1] ?? '') : '';
};

/**
 * Reads the Cognito **access token** from cookies set by AWS Amplify's CookieStorage.
 * This is the token sent to the backend API as a Bearer token.
 *
 * Access tokens carry `cognito:groups` (for authorization) and `sub` but do NOT
 * carry the `custom:idp_*` profile claims — those live only in the ID token.
 */
export const getAccessTokenFromCookie = (): string | undefined => {
  const baseCookieName = `CognitoIdentityServiceProvider.${env.VITE_USER_POOLS_WEB_CLIENT_ID}`;
  const userId = encodeURIComponent(getCookie(`${baseCookieName}.LastAuthUser`));
  if (userId) {
    const token = getCookie(`${baseCookieName}.${userId}.accessToken`);
    return token || undefined;
  }
  return undefined;
};

/**
 * Reads the Cognito **ID token** from cookies set by AWS Amplify's CookieStorage.
 * Used **only** on the frontend to populate the local user profile (display name,
 * email, IDP provider, etc.). Never sent to the backend.
 */
export const getIdTokenFromCookie = (): string | undefined => {
  const baseCookieName = `CognitoIdentityServiceProvider.${env.VITE_USER_POOLS_WEB_CLIENT_ID}`;
  const userId = encodeURIComponent(getCookie(`${baseCookieName}.LastAuthUser`));
  if (userId) {
    const token = getCookie(`${baseCookieName}.${userId}.idToken`);
    return token || undefined;
  }
  return undefined;
};

/**
 * @deprecated Use {@link getAccessTokenFromCookie} for API calls or
 * {@link getIdTokenFromCookie} for local profile parsing.
 */
export const getUserTokenFromCookie = getAccessTokenFromCookie;

/**
 * Drops every Amplify token/session entry for the configured app client. Used
 * Drops every Amplify token/session cookie for the configured app client. Used
 * by the federated-logout path, which drives the sign-out redirect chain itself
 * (Siteminder → KC → Cognito → app) instead of Amplify's signOut(): clearing
 * the tokens here means that when the browser lands back on the app at the end
 * of the chain, AuthProvider bootstraps with no session and renders the
 * logged-out Landing. The chain's final Cognito /logout hop clears the Cognito
 * session cookie server-side.
 *
 * REPT configures Amplify with CookieStorage (main.tsx), but Amplify's v6 flow
 * doesn't always keep every token as a DOM-visible cookie — some can land in
 * localStorage (see the note in services/http/headers.ts). If ANY store still
 * holds a valid token when the app re-bootstraps after the logout chain, the
 * SPA reads it and considers the user logged in (bouncing straight back to
 * /dashboard). So we sweep ALL three stores — cookies, localStorage,
 * sessionStorage — for the Cognito key prefix, and for cookies we expire under
 * every domain/path combination the cookie may have been written with (a cookie
 * only clears when the deletion's domain+path match how it was set).
 */
export const clearStoredTokens = (): void => {
  const prefix = `CognitoIdentityServiceProvider.${env.VITE_USER_POOLS_WEB_CLIENT_ID}`;

  // Cookies — enumerate names from document.cookie, expire each under the likely
  // attribute combinations (Amplify sets domain = hostname, path = base path).
  try {
 * REPT stores Amplify tokens in cookies (main.tsx CookieStorage), NOT
 * localStorage — so this expires cookies with the same domain/path attributes
 * they were written with (domain = hostname, path = VITE_BASE_PATH || '/'),
 * which a cookie deletion must match to take effect.
 */
export const clearStoredTokens = (): void => {
  try {
    const prefix = `CognitoIdentityServiceProvider.${env.VITE_USER_POOLS_WEB_CLIENT_ID}`;
    const path = env.VITE_BASE_PATH || '/';
    const host = window.location.hostname;
    const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie
      .split(';')
      .map((c) => c.trim().split('=')[0])
      .filter((name) => name && name.startsWith(prefix))
      .forEach((name) => {
        for (const p of new Set([path, '/'])) {
          document.cookie = `${name}=; expires=${past}; path=${p}`;
          document.cookie = `${name}=; expires=${past}; path=${p}; domain=${host}`;
          document.cookie = `${name}=; expires=${past}; path=${p}; domain=.${host}`;
        }
      });
  } catch {
    /* cookies disabled — nothing to clear */
  }

  // Web storage — Amplify may have written some tokens here despite the
  // CookieStorage config; the app reads whichever store has them, so clear both.
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && key.startsWith(prefix)) keys.push(key);
      }
      keys.forEach((k) => store.removeItem(k));
    } catch {
      /* storage disabled — skip */
    }
        // Expire under every attribute combination Amplify may have used, since
        // a cookie only clears when domain+path match how it was set.
        document.cookie = `${name}=; expires=${past}; path=${path}`;
        document.cookie = `${name}=; expires=${past}; path=${path}; domain=${host}`;
        document.cookie = `${name}=; expires=${past}; path=/`;
      });
  } catch {
    /* storage disabled — nothing to clear */
  }
};

/**
 * Parses a Cognito ID token JWT into the app's FamLoginUser shape.
 * Extracts display name, IDP provider, Cognito groups → roles.
 *
 * NOTE: This must be called with the **ID token**, not the access token,
 * because only the ID token carries the `custom:idp_*` profile claims.
 */
export const parseToken = (idToken: JWT | undefined): FamLoginUser | undefined => {
  if (!idToken) return undefined;
  const decodedIdToken = idToken?.payload;
  const displayName = (decodedIdToken?.['custom:idp_display_name'] as string) || '';
  const idpProvider = validIdpProviders.includes(
    (decodedIdToken?.['custom:idp_name'] as string)?.toUpperCase() as IdpProviderType,
  )
    ? ((decodedIdToken?.['custom:idp_name'] as string).toUpperCase() as IdpProviderType)
    : undefined;
  const hasComma = displayName.includes(',');
  let [lastName, firstName] = hasComma ? displayName.split(', ') : displayName.split(' ');
  if (!hasComma) [lastName, firstName] = [firstName, lastName];
  const sanitizedFirstName = hasComma ? firstName?.split(' ')[0]?.trim() : firstName || '';
  const userName = (decodedIdToken?.['custom:idp_username'] as string) || '';
  const email = (decodedIdToken?.['email'] as string) || '';
  const cognitoGroups = extractGroups(decodedIdToken);
  const privileges = parsePrivileges(cognitoGroups);
  const derivedRoles = Object.keys(privileges) as ROLE_TYPE[];
  return {
    userName,
    displayName,
    email,
    idpProvider,
    privileges,
    roles: derivedRoles,
    firstName: sanitizedFirstName,
    lastName,
    providerUsername: `${idpProvider}\\${userName}`,
  };
};

/**
 * Parses Cognito group strings into a user privilege object.
 *
 * Recognizes groups that exactly match {@link AVAILABLE_ROLES} (e.g. "REPT_ADMIN", "REPT_VIEWER").
 * Unrecognized groups are silently ignored.
 *
 * @param {string[]} input - Array of group strings from Cognito.
 * @returns {USER_PRIVILEGE_TYPE} The parsed privilege object.
 */
export function parsePrivileges(input: string[]): USER_PRIVILEGE_TYPE {
  const result: USER_PRIVILEGE_TYPE = {};
  for (const item of input) {
    // Direct match against known Cognito groups (REPT_ADMIN, REPT_VIEWER)
    if (AVAILABLE_ROLES.includes(item as ROLE_TYPE)) {
      result[item as ROLE_TYPE] = null; // null = global (non-scoped) role
    }
  }
  return result;
}

/**
 * Extracts Cognito groups from a decoded JWT payload.
 * @param {object | undefined} decodedIdToken - The decoded JWT payload.
 * @returns {string[]} Array of group strings, or empty array if none found.
 */
export function extractGroups(decodedIdToken: object | undefined): string[] {
  if (!decodedIdToken) return [];
  if ('cognito:groups' in decodedIdToken) {
    return decodedIdToken['cognito:groups'] as string[];
  }
  return [];
}
