import { createWriteStream } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { ZipArchive } from 'archiver';
import { z } from 'zod';
import {
  APP_VERSION,
  appointmentSchema,
  BACKUP_COLLECTIONS,
  BACKUP_FILE_PATTERN,
  BACKUP_FORMAT,
  BACKUP_VERSION,
  clinicSettingsSchema,
  dietPlanSchema,
  foodSchema,
  measurementSchema,
  patientSchema,
  prescriptionSchema,
  prescriptionTemplateSchema,
  userSchema,
} from '@clinic/shared';
import { AppError, notFound } from '../lib/errors.js';

/** @typedef {import('@clinic/shared').BackupCollection} BackupCollection */

/** Record schemas used to validate a backup before anything is replaced. */
const SCHEMAS = /** @type {Record<BackupCollection, z.ZodType>} */ ({
  settings: clinicSettingsSchema,
  users: userSchema.extend({
    passwordHash: z.string().min(1),
    tokenVersion: z.number().int().min(0).default(0),
  }),
  patients: patientSchema,
  measurements: measurementSchema,
  appointments: appointmentSchema,
  foods: foodSchema,
  dietPlans: dietPlanSchema,
  prescriptionTemplates: prescriptionTemplateSchema,
  prescriptions: prescriptionSchema,
});

/** Stored backups kept in BACKUP_DIR (oldest removed first). */
const KEEP_BACKUPS = 20;
const MAX_REPORTED_ERRORS = 20;

/** `backup-YYYYMMDD-HHmmss.zip` in UTC. @param {Date} at @param {string} [suffix] */
const backupName = (at, suffix = '') =>
  `backup-${at.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)}${suffix}.zip`;

/**
 * Driver-independent backup and restore. Export writes every collection (through the
 * repository interfaces) plus the uploaded files into a zip; import validates the whole
 * archive first and only then replaces the data. Used by the API and the CLI
 * (`npm run backup`), and doubles as the Mongo → SQLite migration path.
 * @param {import('../context.js').AppContext} ctx
 * @param {{ patients: import('./patientService.js').PatientService }} deps
 */
export function createBackupService({ repositories, storage, config, now, logger }, { patients }) {
  const dir = config.paths.backupDir;

  async function snapshot() {
    /** @type {Record<string, unknown[]>} */
    const collections = {};
    for (const name of BACKUP_COLLECTIONS) collections[name] = await repositories[name].exportAll();
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      createdAt: now().toISOString(),
      appVersion: APP_VERSION,
      dbDriver: repositories.db.driver,
      collections,
    };
  }

  /** Writes a backup zip into BACKUP_DIR and returns its name. @param {string} [suffix] */
  async function writeBackup(suffix = '') {
    await mkdir(dir, { recursive: true });
    const name = backupName(now(), suffix);
    const target = path.join(dir, name);
    const data = await snapshot();
    const files = await storage.list();

    await new Promise((resolve, reject) => {
      const output = createWriteStream(target);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on('close', () => resolve(undefined));
      archive.on('error', reject);
      archive.on('warning', (/** @type {Error} */ err) => logger.warn({ err }, 'Backup warning'));
      archive.pipe(output);
      archive.append(JSON.stringify(data, null, 1), { name: 'data.json' });
      for (const key of files) archive.file(storage.getPath(key), { name: `files/${key}` });
      void archive.finalize();
    });
    await prune();
    return name;
  }

  async function prune() {
    const names = (await readdir(dir)).filter((n) => BACKUP_FILE_PATTERN.test(n)).sort();
    for (const old of names.slice(0, Math.max(0, names.length - KEEP_BACKUPS))) {
      await rm(path.join(dir, old), { force: true });
    }
  }

  /**
   * Parses and validates an archive completely; throws before any change is made.
   * @param {Buffer} buffer
   */
  function readArchive(buffer) {
    let zip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new AppError('VALIDATION_ERROR', 'errors.backupInvalid');
    }
    const entry = zip.getEntry('data.json');
    if (!entry) throw new AppError('VALIDATION_ERROR', 'errors.backupInvalid');
    /** @type {any} */
    let data;
    try {
      data = JSON.parse(entry.getData().toString('utf8'));
    } catch {
      throw new AppError('VALIDATION_ERROR', 'errors.backupInvalid');
    }
    if (data?.format !== BACKUP_FORMAT || typeof data.version !== 'number' || !data.collections) {
      throw new AppError('VALIDATION_ERROR', 'errors.backupInvalid');
    }
    if (data.version > BACKUP_VERSION) throw new AppError('VALIDATION_ERROR', 'errors.backupNewer');

    /** @type {Array<{ collection: string, index: number, path: string, message: string }>} */
    const errors = [];
    /** @type {Record<string, unknown[]>} */
    const collections = {};
    for (const name of BACKUP_COLLECTIONS) {
      const raw = data.collections[name] ?? [];
      if (!Array.isArray(raw)) {
        errors.push({ collection: name, index: -1, path: '', message: 'not an array' });
        continue;
      }
      collections[name] = raw.flatMap((record, index) => {
        const parsed = SCHEMAS[name].safeParse(record);
        if (parsed.success) return [parsed.data];
        const issue = parsed.error.issues[0];
        if (errors.length < MAX_REPORTED_ERRORS) {
          errors.push({
            collection: name,
            index,
            path: issue?.path.join('.') ?? '',
            message: issue?.message ?? '',
          });
        }
        return [];
      });
    }
    if (errors.length)
      throw new AppError('VALIDATION_ERROR', 'errors.backupInvalidRecords', errors);

    const users = /** @type {Array<{ role: string, isActive: boolean }>} */ (collections.users);
    if (!users.some((u) => u.role === 'admin' && u.isActive)) {
      throw new AppError('VALIDATION_ERROR', 'errors.backupNoAdmin');
    }

    const files = zip
      .getEntries()
      .filter((e) => !e.isDirectory && e.entryName.startsWith('files/'))
      .map((e) => ({ key: e.entryName.slice('files/'.length), data: e.getData() }))
      .filter((f) => {
        try {
          storage.getPath(f.key); // rejects traversal like files/../../x
          return true;
        } catch {
          return false;
        }
      });

    return { data, collections, files };
  }

  return {
    /** Creates a backup (kept in BACKUP_DIR) and records the date. */
    async exportBackup() {
      const name = await writeBackup();
      await repositories.settings.upsert({ lastBackupAt: now().toISOString() });
      return { name, path: path.join(dir, name) };
    },

    /** @returns {Promise<import('@clinic/shared').BackupInfo>} */
    async info() {
      const settings = await repositories.settings.get();
      await mkdir(dir, { recursive: true });
      const names = (await readdir(dir))
        .filter((n) => BACKUP_FILE_PATTERN.test(n))
        .sort()
        .reverse();
      const backups = await Promise.all(
        names.map(async (name) => {
          const s = await stat(path.join(dir, name));
          return { name, size: s.size, createdAt: s.mtime.toISOString() };
        }),
      );
      return { lastBackupAt: settings?.lastBackupAt ?? null, backups };
    },

    /** Path of a stored backup (only server-generated names are served). @param {string} name */
    async storedBackupPath(name) {
      if (!BACKUP_FILE_PATTERN.test(name)) throw notFound('backup');
      const full = path.join(dir, name);
      try {
        await stat(full);
      } catch {
        throw notFound('backup');
      }
      return full;
    },

    /**
     * Validates an archive; with `dryRun` only reports what it contains. A real import
     * needs `confirm`, first saves a safety backup of the current data, then replaces
     * every collection and the uploaded files.
     * @param {Buffer} buffer
     * @param {{ dryRun: boolean, confirm: boolean }} options
     * @returns {Promise<import('@clinic/shared').BackupImportResult>}
     */
    async importBackup(buffer, { dryRun, confirm }) {
      const { data, collections, files } = readArchive(buffer);
      const summary = {
        format: data.format,
        version: data.version,
        createdAt: String(data.createdAt ?? ''),
        appVersion: String(data.appVersion ?? ''),
        counts: /** @type {Record<BackupCollection, number>} */ (
          Object.fromEntries(BACKUP_COLLECTIONS.map((c) => [c, collections[c]?.length ?? 0]))
        ),
        files: files.length,
      };
      if (dryRun) return { ...summary, dryRun: true, safetyBackup: null };
      if (!confirm) throw new AppError('VALIDATION_ERROR', 'errors.backupConfirm');

      const safetyBackup = await writeBackup('-pre-restore');
      for (const name of BACKUP_COLLECTIONS) {
        await repositories[name].importAll(/** @type {any[]} */ (collections[name]));
      }
      for (const key of await storage.list()) await storage.delete(key);
      for (const f of files) await storage.save(f.key, f.data);
      await patients.refreshAllStatuses();
      // The archive's settings were captured before its own date was recorded.
      const restored = await repositories.settings.get();
      const takenAt = summary.createdAt;
      if (takenAt && (!restored?.lastBackupAt || restored.lastBackupAt < takenAt)) {
        await repositories.settings.upsert({ lastBackupAt: takenAt });
      }
      logger.info({ counts: summary.counts, safetyBackup }, 'Backup restored');
      return { ...summary, dryRun: false, safetyBackup };
    },

    /** For the CLI: read an archive file from disk. @param {string} file */
    readFile: (file) => readFile(file),
  };
}

/** @typedef {ReturnType<typeof createBackupService>} BackupService */
