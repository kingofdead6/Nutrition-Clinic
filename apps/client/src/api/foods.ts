import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Food,
  FoodCreateInput,
  FoodImportResult,
  FoodListQuery,
  FoodUpdateInput,
  Paginated,
} from '@shared';
import { apiClient } from '../lib/apiClient';

export const FOODS_KEY = ['foods'] as const;

export function useFoods(params: Partial<FoodListQuery>, enabled = true) {
  return useQuery({
    queryKey: [...FOODS_KEY, 'list', params],
    queryFn: ({ signal }) =>
      apiClient.get<Paginated<Food>>('/foods', { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 5 * 60_000,
  });
}

function useFoodMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: FOODS_KEY }),
  });
}

export const useCreateFood = () =>
  useFoodMutation((input: FoodCreateInput) => apiClient.post<Food>('/foods', input));

export const useUpdateFood = () =>
  useFoodMutation(({ id, ...patch }: FoodUpdateInput & { id: string }) =>
    apiClient.put<Food>(`/foods/${id}`, patch),
  );

export const useDeleteFood = () =>
  useFoodMutation((id: string) => apiClient.delete(`/foods/${id}`));

export const useInstallDefaultFoods = () =>
  useFoodMutation(() => apiClient.post<{ added: number }>('/foods/defaults'));

/** Dry runs do not change data, so only real imports refresh the list. */
export function useImportFoods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) => {
      const body = new FormData();
      body.append('file', file);
      return apiClient.post<FoodImportResult>('/foods/import', body, { query: { dryRun } });
    },
    onSuccess: (result) =>
      result.dryRun ? undefined : qc.invalidateQueries({ queryKey: FOODS_KEY }),
  });
}
