import { Tag } from '@carbon/react';
import { type FC } from 'react';

import { getStatusTagColor } from './utils';

type StatusTagProps = {
  value: string | null | undefined;
  emptyFallback?: string;
};

export const StatusTag: FC<StatusTagProps> = ({ value, emptyFallback = '—' }) => {
  const trimmed = value?.trim();
  if (!trimmed) return <>{emptyFallback}</>;
  return <Tag type={getStatusTagColor(trimmed)}>{trimmed}</Tag>;
};

export default StatusTag;
