import type { ReptOrgUnitRef } from '@/services/rept/admin/types';

export const describeOrgUnit = (orgUnit?: ReptOrgUnitRef | null): string => {
  if (!orgUnit) {
    return '—';
  }
  const identifier = orgUnit.code?.trim() || (orgUnit.number ? `#${orgUnit.number}` : null);
  const name = orgUnit.name?.trim();

  if (identifier && name) {
    return `${identifier} — ${name}`;
  }

  return name || identifier || '—';
};

export const formatDisplayText = (value?: string | null, fallback = '—') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const safeRevisionCount = (revision?: number | null) => {
  return typeof revision === 'number' ? revision : 0;
};

export const trimToNull = (value?: string) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const paginateRows = <T extends { id: string | number }>(
  rows: T[],
  page: number,
  size: number,
): {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
} => {
  const safeSize = size > 0 ? size : 10;
  const safePage = Math.max(page, 0);
  const totalElements = rows.length;
  const totalPages = safeSize > 0 ? Math.ceil(totalElements / safeSize) : 0;
  const offset = safePage * safeSize;
  const content = rows.slice(offset, offset + safeSize);

  return {
    content,
    page: {
      size: safeSize,
      number: safePage,
      totalElements,
      totalPages,
    },
  };
};
