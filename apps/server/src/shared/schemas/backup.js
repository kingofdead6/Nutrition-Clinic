// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
/**
 * Backup archive (.zip): `data.json` (every collection, driver-independent) plus
 * `files/<storage key>` for uploads (logo, patient photos). Restoring goes through the
 * repository interfaces, so the same file migrates a Mongo installation to SQLite.
 */
export const BACKUP_FORMAT = 'nutrition-clinic-backup';
export const BACKUP_VERSION = 1;
/** Restore order: parents before children. */
export const BACKUP_COLLECTIONS = [
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
export const backupImportQuerySchema = z.object({
  dryRun: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default(false),
  /** Real imports replace all data and must be explicitly confirmed. */
  confirm: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default(false),
});
/** Backup file names the server generates (also the only names it will serve). */
export const BACKUP_FILE_PATTERN = /^backup-\d{8}-\d{6}(-pre-restore)?\.zip$/;
