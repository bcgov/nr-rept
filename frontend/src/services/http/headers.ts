import { ensureFreshUser, getUserManager } from '@/services/keycloak';

export type HeaderRecord = Record<string, string>;

// Converts any HeadersInit shape (Headers, [key,value][], Record) into a plain object.
const normalizeHeaders = (headers?: HeadersInit): HeaderRecord => {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const normalized: HeaderRecord = {};
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<HeaderRecord>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return Object.entries(headers).reduce<HeaderRecord>((acc, [key, value]) => {
    if (typeof value === 'undefined' || value === null) return acc;
    acc[key] = String(value);
    return acc;
  }, {});
};

/**
 * Reads the CSRF token from the XSRF-TOKEN cookie.
 * Spring Security's CookieCsrfTokenRepository stores the token in this cookie.
 */
const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * The current access token, renewed first if it is at or near expiry.
 *
 * The access token lives five minutes on this realm, so "is it still valid?" is
 * a live question on almost every request — hence renewing here rather than
 * reading whatever is stored and hoping. `ensureFreshUser` is a no-op until the
 * token is nearly out, so the common case costs a storage read.
 */
const getAccessToken = async (): Promise<string | undefined> => {
  try {
    const user = await ensureFreshUser(getUserManager());
    return user?.access_token;
  } catch {
    // A failed renewal is the session ending. The request goes out unauthorized
    // and the 401 handling takes it from there; throwing here would turn every
    // in-flight call into an unhandled rejection at the same moment.
    return undefined;
  }
};

// Builds headers for backend API calls: merges custom headers, injects the
// Bearer token and Spring Security's XSRF-TOKEN (CSRF protection).
export const buildAuthorizedHeaders = async (
  ...headerSets: Array<HeadersInit | undefined>
): Promise<HeaderRecord> => {
  const merged = headerSets.reduce<HeaderRecord>((acc, headerSet) => {
    return { ...acc, ...normalizeHeaders(headerSet) };
  }, {});

  const token = await getAccessToken();
  if (token) {
    merged.Authorization = `Bearer ${token}`;
  }

  // Include CSRF token for state-changing requests
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    merged['X-XSRF-TOKEN'] = csrfToken;
  }

  return merged;
};
