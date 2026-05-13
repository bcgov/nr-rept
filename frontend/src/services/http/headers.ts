import { fetchAuthSession } from 'aws-amplify/auth';

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
 * Reads the current Cognito access token from Amplify's auth session.
 * Returns the token regardless of whether Amplify stores it in cookies,
 * localStorage, memory, or anywhere else — parsing document.cookie directly
 * was fragile because the configured CookieStorage doesn't always write the
 * tokens as DOM-visible cookies (depending on Amplify's internal flow).
 */
const getAccessToken = async (): Promise<string | undefined> => {
  try {
    const { tokens } = (await fetchAuthSession()) ?? {};
    return tokens?.accessToken?.toString();
  } catch {
    return undefined;
  }
};

// Builds headers for backend API calls: merges custom headers, injects the
// Cognito Bearer token and Spring Security's XSRF-TOKEN (CSRF protection).
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
