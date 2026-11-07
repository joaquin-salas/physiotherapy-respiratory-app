import {
  hashKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { authApi, type CurrentUser, type LoginInput } from './auth.api';

/** Cache key for the logged-in user. `null` in the cache means "not logged in". */
export const currentUserKey = ['auth', 'me'];

/** Who is logged in: a user, `null` if nobody is, or pending while it's being checked. */
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: async (): Promise<CurrentUser | null> => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: Infinity, // only changes on login/logout, which update the cache directly
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (user) => queryClient.setQueryData(currentUserKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    // Even if the request fails, log out locally and forget all cached data:
    // the next user of this browser must not see the previous physio's data.
    onSettled: () => {
      // Update the current user in place (RequireAuth is subscribed to it and
      // redirects to /login). Don't remove this query: removing it would
      // disconnect RequireAuth from the cache and it would never see the change.
      queryClient.setQueryData(currentUserKey, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryHash !== hashKey(currentUserKey),
      });
    },
  });
}
