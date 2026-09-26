import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Paginated,
  PrescriptionCreateInput,
  PrescriptionListQuery,
  PrescriptionPreview,
  PrescriptionTemplate,
  PrescriptionTemplateCreateInput,
  PrescriptionTemplateUpdateInput,
  PrescriptionUpdateInput,
  PrescriptionWithPatient,
} from '@shared';
import { apiClient } from '../lib/apiClient';

export const RX_KEY = ['prescriptions'] as const;
export const TEMPLATES_KEY = ['prescriptionTemplates'] as const;

export function usePrescriptionTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async ({ signal }) =>
      (await apiClient.get<{ data: PrescriptionTemplate[] }>('/prescription-templates', { signal }))
        .data,
  });
}

function useTemplateMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export const useCreateTemplate = () =>
  useTemplateMutation((input: PrescriptionTemplateCreateInput) =>
    apiClient.post<PrescriptionTemplate>('/prescription-templates', input),
  );
export const useUpdateTemplate = () =>
  useTemplateMutation(({ id, ...patch }: PrescriptionTemplateUpdateInput & { id: string }) =>
    apiClient.put<PrescriptionTemplate>(`/prescription-templates/${id}`, patch),
  );
export const useDeleteTemplate = () =>
  useTemplateMutation((id: string) => apiClient.delete(`/prescription-templates/${id}`));
export const useInstallDefaultTemplates = () =>
  useTemplateMutation(() => apiClient.post<{ added: number }>('/prescription-templates/defaults'));

export function usePrescriptions(params: Partial<PrescriptionListQuery>) {
  return useQuery({
    queryKey: [...RX_KEY, 'list', params],
    queryFn: ({ signal }) =>
      apiClient.get<Paginated<PrescriptionWithPatient>>('/prescriptions', {
        query: { ...params },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

export function usePatientPrescriptions(patientId: string | undefined) {
  return useQuery({
    queryKey: [...RX_KEY, 'patient', patientId],
    queryFn: async ({ signal }) =>
      (
        await apiClient.get<{ data: PrescriptionWithPatient[] }>(
          `/patients/${patientId}/prescriptions`,
          { signal },
        )
      ).data,
    enabled: !!patientId,
  });
}

export function usePrescription(id: string | undefined) {
  return useQuery({
    queryKey: [...RX_KEY, 'detail', id],
    queryFn: ({ signal }) =>
      apiClient.get<PrescriptionWithPatient>(`/prescriptions/${id}`, { signal }),
    enabled: !!id,
  });
}

export const usePreviewPrescription = () =>
  useMutation({
    mutationFn: (input: PrescriptionCreateInput) =>
      apiClient.post<PrescriptionPreview>('/prescriptions/preview', input),
  });

function useRxMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: RX_KEY }),
  });
}

export const useCreatePrescription = () =>
  useRxMutation((input: PrescriptionCreateInput) =>
    apiClient.post<PrescriptionWithPatient>('/prescriptions', input),
  );
export const useUpdatePrescription = () =>
  useRxMutation(({ id, ...patch }: PrescriptionUpdateInput & { id: string }) =>
    apiClient.put<PrescriptionWithPatient>(`/prescriptions/${id}`, patch),
  );
export const useDeletePrescription = () =>
  useRxMutation((id: string) => apiClient.delete(`/prescriptions/${id}`));
