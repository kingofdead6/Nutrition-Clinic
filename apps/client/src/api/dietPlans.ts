import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DietPlanCreateInput,
  DietPlanDuplicateInput,
  DietPlanListQuery,
  DietPlanUpdateInput,
  DietPlanWithPatient,
  Paginated,
} from '@shared';
import { apiClient } from '../lib/apiClient';
import { invalidatePatientData } from './patients';

export const PLANS_KEY = ['dietPlans'] as const;
export const planKey = (id: string) => [...PLANS_KEY, 'detail', id] as const;
export const patientPlansKey = (patientId: string) => [...PLANS_KEY, 'patient', patientId] as const;

export function useDietPlans(params: Partial<DietPlanListQuery>) {
  return useQuery({
    queryKey: [...PLANS_KEY, 'list', params],
    queryFn: ({ signal }) =>
      apiClient.get<Paginated<DietPlanWithPatient>>('/diet-plans', {
        query: { ...params },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useDietPlan(id: string | undefined) {
  return useQuery({
    queryKey: planKey(id ?? ''),
    queryFn: ({ signal }) => apiClient.get<DietPlanWithPatient>(`/diet-plans/${id}`, { signal }),
    enabled: !!id,
  });
}

export function usePatientPlans(patientId: string | undefined) {
  return useQuery({
    queryKey: patientPlansKey(patientId ?? ''),
    queryFn: async ({ signal }) =>
      (
        await apiClient.get<{ data: DietPlanWithPatient[] }>(`/patients/${patientId}/diet-plans`, {
          signal,
        })
      ).data,
    enabled: !!patientId,
  });
}

/** Plans drive patient statuses (new plan / plan ended), so patient data is refreshed too. */
function usePlanMutation<TVars>(fn: (vars: TVars) => Promise<DietPlanWithPatient>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (plan) => {
      qc.setQueryData(planKey(plan.id), plan);
      await Promise.all([qc.invalidateQueries({ queryKey: PLANS_KEY }), invalidatePatientData(qc)]);
    },
  });
}

export const useCreatePlan = () =>
  usePlanMutation((input: DietPlanCreateInput) =>
    apiClient.post<DietPlanWithPatient>('/diet-plans', input),
  );

export const useUpdatePlan = () =>
  usePlanMutation(({ id, ...patch }: DietPlanUpdateInput & { id: string }) =>
    apiClient.put<DietPlanWithPatient>(`/diet-plans/${id}`, patch),
  );

export const useActivatePlan = () =>
  usePlanMutation((id: string) =>
    apiClient.post<DietPlanWithPatient>(`/diet-plans/${id}/activate`),
  );

export const useDeactivatePlan = () =>
  usePlanMutation((id: string) =>
    apiClient.post<DietPlanWithPatient>(`/diet-plans/${id}/deactivate`),
  );

export const useDuplicatePlan = () =>
  usePlanMutation(({ id, ...options }: Partial<DietPlanDuplicateInput> & { id: string }) =>
    apiClient.post<DietPlanWithPatient>(`/diet-plans/${id}/duplicate`, options),
  );

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/diet-plans/${id}`),
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: PLANS_KEY }), invalidatePatientData(qc)]),
  });
}
