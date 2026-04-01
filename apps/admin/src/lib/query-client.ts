import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            return false;
          }

          return failureCount < 1;
        },
      },
    },
  });
}
