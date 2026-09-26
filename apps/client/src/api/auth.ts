import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AuthStatus,
  LoginInput,
  MeResponse,
  PasswordChangeInput,
  ProfileUpdateInput,
  SetupInput,
  User,
} from '@shared';
import { ApiError, apiClient } from '../lib/apiClient';
import { ME_QUERY_KEY } from '../lib/queryClient';

export const AUTH_STATUS_KEY = ['auth', 'status'] as const;

/** Public clinic branding + whether first-run setup is still needed. */
export function useAuthStatus() {
  return useQuery({
    queryKey: AUTH_STATUS_KEY,
    queryFn: ({ signal }) => apiClient.get<AuthStatus>('/auth/status', { signal }),
    staleTime: 5 * 60_000,
  });
}

/** The signed-in user, or null when signed out. */
export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async ({ signal }): Promise<User | null> => {
      try {
        return (await apiClient.get<MeResponse>('/auth/me', { signal })).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => apiClient.post<MeResponse>('/auth/login', input),
    onSuccess: ({ user }) => qc.setQueryData(ME_QUERY_KEY, user),
  });
}

export function useSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SetupInput) => apiClient.post<MeResponse>('/auth/setup', input),
    onSuccess: async ({ user }) => {
      qc.setQueryData(ME_QUERY_KEY, user);
      await qc.invalidateQueries({ queryKey: AUTH_STATUS_KEY });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<void>('/auth/logout'),
    onSettled: () => {
      // Drop every cached patient/clinic record from memory, then mark signed out.
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      qc.setQueryData(ME_QUERY_KEY, null);
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => apiClient.put<MeResponse>('/auth/me', input),
    onSuccess: ({ user }) => qc.setQueryData(ME_QUERY_KEY, user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChangeInput) => apiClient.put<void>('/auth/password', input),
  });
}
