export type StatusTagType =
  | 'red'
  | 'magenta'
  | 'purple'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'gray'
  | 'cool-gray'
  | 'warm-gray';

const STATUS_TAG_COLORS: Record<string, StatusTagType> = {
  active: 'green',
  pending: 'blue',
  inactive: 'red',
};

export const getStatusTagColor = (value: string | null | undefined): StatusTagType => {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return 'gray';
  return STATUS_TAG_COLORS[trimmed] ?? 'gray';
};
