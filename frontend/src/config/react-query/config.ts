import { type QueryClientConfig } from '@tanstack/react-query';

import { noRetry } from './retry';
import { THREE_HOURS } from './TimeUnits';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnMount: false, // Default is caching fetched values
      refetchOnWindowFocus: false,
      staleTime: THREE_HOURS,
      gcTime: THREE_HOURS,
      retry: noRetry,
    },
  },
};
