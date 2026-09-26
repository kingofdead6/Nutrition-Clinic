import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

export const ME_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Any 401 from the API means the session is gone (expired, revoked, logged out elsewhere):
 * mark the user as signed out and let <RequireAuth> redirect to the login page.
 */
function handleUnauthenticated(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(ME_QUERY_KEY, null);
  }
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthenticated }),
  mutationCache: new MutationCache({ onError: handleUnauthenticated }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Client errors (4xx) will not succeed on retry; network/5xx get one more try.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 1,
    },
  },
});
