import { type QueryClientConfig } from '@tanstack/react-query';

import { noRetry } from './retry';
import { THREE_HOURS } from './TimeUnits';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      gcTime: THREE_HOURS,
      retry: noRetry,
    },
  },
};
