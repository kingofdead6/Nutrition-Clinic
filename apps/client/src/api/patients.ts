import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  Paginated,
  Patient,
  PatientCreateInput,
  PatientListQuery,
  PatientUpdateInput,
} from '@shared';
import { apiClient } from '../lib/apiClient';

export const PATIENTS_KEY = ['patients'] as const;
export const patientKey = (id: string) => ['patients', 'detail', id] as const;

export type PatientListParams = Partial<PatientListQuery>;

/** Patient data feeds lists, details, appointment rows (names) and dashboard figures. */
export function invalidatePatientData(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
    qc.invalidateQueries({ queryKey: ['appointments'] }),
    qc.invalidateQueries({ queryKey: ['dashboard'] }),
    qc.invalidateQueries({ queryKey: ['dietPlans'] }),
    qc.invalidateQueries({ queryKey: ['reports'] }),
  ]);
}

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, 'list', params],
    queryFn: ({ signal }) =>
      apiClient.get<Paginated<Patient>>('/patients', { query: { ...params }, signal }),
    // Keep the current page on screen while the next filter/page loads (no flash).
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: patientKey(id ?? ''),
    queryFn: ({ signal }) => apiClient.get<Patient>(`/patients/${id}`, { signal }),
    enabled: !!id,
  });
}

/** Patient writes change lists, details, and (later) dashboard figures: refresh them all. */
function usePatientMutation<TVars>(fn: (vars: TVars) => Promise<Patient>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (patient) => {
      qc.setQueryData(patientKey(patient.id), patient);
      await invalidatePatientData(qc);
    },
  });
}

export const useCreatePatient = () =>
  usePatientMutation((input: PatientCreateInput) => apiClient.post<Patient>('/patients', input));

export const useUpdatePatient = (id: string) =>
  usePatientMutation((patch: PatientUpdateInput) =>
    apiClient.put<Patient>(`/patients/${id}`, patch),
  );

export const useArchivePatient = (id: string) =>
  usePatientMutation((archived: boolean) =>
    apiClient.patch<Patient>(`/patients/${id}/archive`, { archived }),
  );

export const useUploadPatientPhoto = (id: string) =>
  usePatientMutation((file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.post<Patient>(`/patients/${id}/photo`, body);
  });

export const useRemovePatientPhoto = (id: string) =>
  usePatientMutation(() => apiClient.delete<Patient>(`/patients/${id}/photo`));

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/patients/${id}`),
    onSuccess: (_void, id) => {
      qc.removeQueries({ queryKey: patientKey(id) });
      return invalidatePatientData(qc);
    },
  });
}

/** Versioned photo URL (the server serves it only to signed-in users). */
export function patientPhotoUrl(patient: Pick<Patient, 'id' | 'photoPath' | 'updatedAt'>) {
  return patient.photoPath
    ? apiClient.url(`/patients/${patient.id}/photo`, { v: Date.parse(patient.updatedAt) })
    : null;
}
