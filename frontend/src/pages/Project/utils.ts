export const MISSING_VALUE = '—';

const isEmptyValue = (value?: string | number | null) =>
  value === null || value === undefined || value === '';

export const formatDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) {
    return MISSING_VALUE;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return MISSING_VALUE;
  }
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    ...options,
    timeZone: 'UTC',
  }).format(date);
};

export const formatWithCode = (label?: string | null, code?: string | number | null) => {
  if (!label && isEmptyValue(code)) {
    return MISSING_VALUE;
  }
  if (label && !isEmptyValue(code)) {
    return `${label} (${code})`;
  }
  if (label) {
    return label;
  }
  if (isEmptyValue(code)) {
    return MISSING_VALUE;
  }
  return `${code}`;
};

export const formatBoolean = (value?: boolean | null) => {
  if (value === null || value === undefined) {
    return MISSING_VALUE;
  }
  return value ? 'Yes' : 'No';
};

export const formatManager = (name?: string | null, userId?: string | null) => {
  if (name && userId) {
    return `${name} (${userId})`;
  }
  return name ?? userId ?? MISSING_VALUE;
};

export const displayValue = (value?: string | number | null) => {
  if (isEmptyValue(value)) {
    return MISSING_VALUE;
  }
  if (typeof value === 'number') {
    return value.toLocaleString('en-CA');
  }
  return value;
};

export const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) {
    return MISSING_VALUE;
  }
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2,
  }).format(value);
};
