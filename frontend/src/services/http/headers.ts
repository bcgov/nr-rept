import { getAccessTokenFromCookie } from '@/context/auth/authUtils';

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

// Builds headers for backend API calls: merges custom headers, injects the
// Cognito Bearer token and Spring Security's XSRF-TOKEN (CSRF protection).
export const buildAuthorizedHeaders = (
  ...headerSets: Array<HeadersInit | undefined>
): HeaderRecord => {
  const merged = headerSets.reduce<HeaderRecord>((acc, headerSet) => {
    return { ...acc, ...normalizeHeaders(headerSet) };
  }, {});

  const token = getAccessTokenFromCookie();
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
