import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, UserCreateInput, UserUpdateInput } from '@shared';
import { apiClient } from '../lib/apiClient';

export const USERS_KEY = ['users'] as const;

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: async ({ signal }) =>
      (await apiClient.get<{ data: User[] }>('/users', { signal })).data,
    enabled,
  });
}

function useInvalidatingMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export const useCreateUser = () =>
  useInvalidatingMutation((input: UserCreateInput) => apiClient.post<User>('/users', input));

export const useUpdateUser = () =>
  useInvalidatingMutation(({ id, ...patch }: UserUpdateInput & { id: string }) =>
    apiClient.put<User>(`/users/${id}`, patch),
  );

export const useDeleteUser = () =>
  useInvalidatingMutation((id: string) => apiClient.delete(`/users/${id}`));
