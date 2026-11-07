import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { currentUserKey } from '@/features/auth/auth.hooks';
import { ApiError } from './api-client';

/** Any 401 means the session is gone (expired or revoked): mark the user as logged out. */
function handleUnauthorized(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(currentUserKey, null); // RequireAuth then redirects to /login
  }
}

/** Cache for server data (TanStack Query), shared by the whole app */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      // Retry network/server errors, but not 4xx: asking again won't change the answer
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 3,
    },
  },
});
