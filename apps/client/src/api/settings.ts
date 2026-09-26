import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClinicSettingsResponse, ClinicSettingsUpdateInput } from '@clinic/shared';
import { apiClient } from '../lib/apiClient';
import { AUTH_STATUS_KEY } from './auth';

export const SETTINGS_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: ({ signal }) => apiClient.get<ClinicSettingsResponse>('/settings', { signal }),
  });
}

/** Settings changes also change the branding shown in the header/login (auth status). */
function useSettingsMutation<TVars>(fn: (vars: TVars) => Promise<ClinicSettingsResponse>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (settings) => {
      qc.setQueryData(SETTINGS_KEY, settings);
      await qc.invalidateQueries({ queryKey: AUTH_STATUS_KEY });
    },
  });
}

export const useUpdateSettings = () =>
  useSettingsMutation((input: ClinicSettingsUpdateInput) =>
    apiClient.put<ClinicSettingsResponse>('/settings', input),
  );

export const useUploadLogo = () =>
  useSettingsMutation((file: File) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient.post<ClinicSettingsResponse>('/settings/logo', body);
  });

export const useRemoveLogo = () =>
  useSettingsMutation(() => apiClient.delete<ClinicSettingsResponse>('/settings/logo'));
