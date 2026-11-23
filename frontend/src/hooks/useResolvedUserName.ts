import { useMemo } from 'react';

import { useReptUser } from '@/services/rept/hooks';

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
 * Looks the user up by EXACT username when `userId` is non-empty. (It used to
 * search, which is a partial match, and fall back to the first hit — so JDOE
 * could show as AJDOE's name.) Returns the formatted
 * display string and a loading flag so callers can show a progress indicator.
 */
export const useResolvedUserName = (userId: string | null | undefined): ResolvedUserName => {
  const raw = userId?.trim() ?? '';
  const trimmed = stripDomainPrefix(raw);

  const query = useReptUser(trimmed);

  const displayValue = useMemo(() => {
    if (!trimmed) return '';

    const match = query.data;
    if (!match) {
      return raw;
    }

    const displayName =
      match.displayName ?? `${match.firstName ?? ''} ${match.lastName ?? ''}`.trim();

    if (!displayName) return raw;

    return `${displayName} (${trimmed})`;
  }, [raw, trimmed, query.data]);

  const isLoading = Boolean(trimmed) && query.isFetching;

  return { displayValue, isLoading };
};
