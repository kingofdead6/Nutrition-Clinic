// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
/**
 * Backup archive (.zip): `data.json` (every collection, driver-independent) plus
 * `files/<storage key>` for uploads (logo, patient photos). Restoring goes through the
 * repository interfaces, so the same file migrates a Mongo installation to SQLite.
 */
export declare const BACKUP_FORMAT = 'nutrition-clinic-backup';
export declare const BACKUP_VERSION = 1;
/** Restore order: parents before children. */
export declare const BACKUP_COLLECTIONS: readonly [
  'settings',
  'users',
  'patients',
  'measurements',
  'appointments',
  'foods',
  'dietPlans',
  'prescriptionTemplates',
  'prescriptions',
];
export type BackupCollection = (typeof BACKUP_COLLECTIONS)[number];
export interface BackupSummary {
  format: string;
  version: number;
  createdAt: string;
  appVersion: string;
  counts: Record<BackupCollection, number>;
  files: number;
}
export interface BackupImportResult extends BackupSummary {
  dryRun: boolean;
  /** Name of the automatic backup of the previous data (real imports only). */
  safetyBackup: string | null;
}
export interface StoredBackup {
  name: string;
  size: number;
  createdAt: string;
}
export interface BackupInfo {
  lastBackupAt: string | null;
  backups: StoredBackup[];
}
export declare const backupImportQuerySchema: z.ZodObject<
  {
    dryRun: z.ZodDefault<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
    confirm: z.ZodDefault<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
  },
  z.core.$strip
>;
/** Backup file names the server generates (also the only names it will serve). */
export declare const BACKUP_FILE_PATTERN: RegExp;
