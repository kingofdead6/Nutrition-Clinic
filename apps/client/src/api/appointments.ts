import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  AppointmentCreateInput,
  AppointmentListQuery,
  AppointmentStatus,
  AppointmentUpdateInput,
  AppointmentWithPatient,
  Paginated,
} from '@clinic/shared';
import { apiClient } from '../lib/apiClient';

export const APPOINTMENTS_KEY = ['appointments'] as const;

export function useAppointments(params: Partial<AppointmentListQuery>, enabled = true) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'list', params],
    queryFn: ({ signal }) =>
      apiClient.get<Paginated<AppointmentWithPatient>>('/appointments', {
        query: { ...params },
        signal,
      }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUpcomingAppointments(limit = 6) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, 'upcoming', limit],
    queryFn: async ({ signal }) =>
      (
        await apiClient.get<{ data: AppointmentWithPatient[] }>('/appointments/upcoming', {
          query: { limit },
          signal,
        })
      ).data,
    // "Upcoming" moves with the clock.
    refetchInterval: 60_000,
  });
}

/**
 * Appointments affect patient last visits/statuses and the dashboard figures, so all
 * three are refreshed after a change.
 */
export function invalidateScheduleData(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
    qc.invalidateQueries({ queryKey: ['patients'] }),
    qc.invalidateQueries({ queryKey: ['dashboard'] }),
    qc.invalidateQueries({ queryKey: ['reports'] }),
  ]);
}

function useAppointmentMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidateScheduleData(qc) });
}

export const useCreateAppointment = () =>
  useAppointmentMutation((input: AppointmentCreateInput) =>
    apiClient.post<AppointmentWithPatient>('/appointments', input),
  );

export const useUpdateAppointment = () =>
  useAppointmentMutation(({ id, ...patch }: AppointmentUpdateInput & { id: string }) =>
    apiClient.put<AppointmentWithPatient>(`/appointments/${id}`, patch),
  );

export const useSetAppointmentStatus = () =>
  useAppointmentMutation(({ id, status }: { id: string; status: AppointmentStatus }) =>
    apiClient.patch<AppointmentWithPatient>(`/appointments/${id}/status`, { status }),
  );

export const useDeleteAppointment = () =>
  useAppointmentMutation((id: string) => apiClient.delete(`/appointments/${id}`));
