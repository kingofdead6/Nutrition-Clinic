import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BackupImportResult, BackupInfo } from '@shared';
import { apiClient } from '../lib/apiClient';

export const BACKUP_KEY = ['backup'] as const;

export function useBackupInfo() {
  return useQuery({
    queryKey: BACKUP_KEY,
    queryFn: ({ signal }) => apiClient.get<BackupInfo>('/backup/info', { signal }),
  });
}

/** Creates a new backup on the server and downloads it. */
export function useExportBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.download('/backup/export', 'backup.zip'),
    onSettled: () => qc.invalidateQueries({ queryKey: BACKUP_KEY }),
  });
}

export const downloadStoredBackup = (name: string) =>
  apiClient.download(`/backup/files/${encodeURIComponent(name)}`, name);

export function useImportBackup() {
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) => {
      const body = new FormData();
      body.append('file', file);
      return apiClient.post<BackupImportResult>('/backup/import', body, {
        query: dryRun ? { dryRun: true } : { confirm: true },
      });
    },
  });
}
