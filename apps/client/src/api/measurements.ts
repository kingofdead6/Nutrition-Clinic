import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Measurement,
  MeasurementCreateInput,
  MeasurementUpdateInput,
  PatientProgress,
} from '@shared';
import { apiClient } from '../lib/apiClient';
import { invalidatePatientData } from './patients';

export const measurementsKey = (patientId: string) =>
  ['patients', 'measurements', patientId] as const;
export const progressKey = (patientId: string) => ['patients', 'progress', patientId] as const;

export function useMeasurements(patientId: string) {
  return useQuery({
    queryKey: measurementsKey(patientId),
    queryFn: async ({ signal }) =>
      (
        await apiClient.get<{ data: Measurement[] }>(`/patients/${patientId}/measurements`, {
          signal,
        })
      ).data,
  });
}

export function useProgress(patientId: string) {
  return useQuery({
    queryKey: progressKey(patientId),
    queryFn: ({ signal }) =>
      apiClient.get<PatientProgress>(`/patients/${patientId}/progress`, { signal }),
  });
}

/**
 * A visit changes the measurements, the progress, and the patient's last visit/status,
 * so every patient query is refreshed.
 */
function useMeasurementMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => invalidatePatientData(qc),
  });
}

export const useCreateMeasurement = (patientId: string) =>
  useMeasurementMutation((input: MeasurementCreateInput) =>
    apiClient.post<Measurement>(`/patients/${patientId}/measurements`, input),
  );

export const useUpdateMeasurement = (patientId: string) =>
  useMeasurementMutation(({ id, ...patch }: MeasurementUpdateInput & { id: string }) =>
    apiClient.put<Measurement>(`/patients/${patientId}/measurements/${id}`, patch),
  );

export const useDeleteMeasurement = (patientId: string) =>
  useMeasurementMutation((id: string) =>
    apiClient.delete(`/patients/${patientId}/measurements/${id}`),
  );
