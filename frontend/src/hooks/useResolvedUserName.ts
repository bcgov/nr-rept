import { useMemo } from 'react';

import { useReptUserSearch } from '@/services/rept/hooks';

import type { ReptUserSearchParams } from '@/services/rept/types';

export type ResolvedUserName = {
  /** The formatted display string, e.g. "John Smith (AGOERTZE)", or the raw value while loading. */
  displayValue: string;
  /** True while the search query is in flight. */
  isLoading: boolean;
};

/**
 * Strips a leading domain prefix (e.g. "IDIR\") from a username.
 * "IDIR\AGOERTZE" → "AGOERTZE", "AGOERTZE" → "AGOERTZE"
 */
const stripDomainPrefix = (value: string): string => {
  const backslashIndex = value.indexOf('\\');
  return backslashIndex >= 0 ? value.substring(backslashIndex + 1) : value;
};

/**
 * Resolves an IDIR username to a display string like "John Smith (AGOERTZE)".
 *
 * Handles values with or without a domain prefix (e.g. "IDIR\AGOERTZE" or "AGOERTZE").
 * Fires a user search query when `userId` is non-empty. Returns the formatted
 * display string and a loading flag so callers can show a progress indicator.
 */
export const useResolvedUserName = (userId: string | null | undefined): ResolvedUserName => {
  const raw = userId?.trim() ?? '';
  const trimmed = stripDomainPrefix(raw);

  const params = useMemo<ReptUserSearchParams | null>(() => {
    if (!trimmed) return null;
    return { userId: trimmed, size: 10 };
  }, [trimmed]);

  const query = useReptUserSearch(params);

  const displayValue = useMemo(() => {
    if (!trimmed) return '';

    const results = query.data?.results;
    if (!results || results.length === 0) {
      return raw;
    }

    // Prefer an exact IDIR match (case-insensitive), fall back to the first result
    const match =
      results.find((u) => u.userId?.toUpperCase() === trimmed.toUpperCase()) ?? results[0];

    const displayName =
      match.displayName ?? `${match.firstName ?? ''} ${match.lastName ?? ''}`.trim();

    if (!displayName) return raw;

    return `${displayName} (${trimmed})`;
  }, [raw, trimmed, query.data?.results]);

  const isLoading = Boolean(trimmed) && query.isFetching;

  return { displayValue, isLoading };
};
