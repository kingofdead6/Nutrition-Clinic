import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { backupImportQuerySchema } from '@clinic/shared';
import { AppError } from '../lib/errors.js';
import { parseParams, parseQuery } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

/** Backup archive upload: one .zip in the multipart field `file`, max 200 MB. */
const zipUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.zip$/i.test(file.originalname) || /zip/.test(file.mimetype);
    cb(ok ? null : new AppError('UNSUPPORTED_MEDIA_TYPE', 'errors.backupType'), ok);
  },
}).single('file');

/**
 * Backup and restore: admin only (a backup contains every record, including users).
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function backupRouter(ctx, { backup }) {
  const router = Router();
  router.use('/backup', authenticate(ctx), requireRole('admin'));

  router.get('/backup/info', async (_req, res) => {
    res.json(await backup.info());
  });

  /** Creates a new backup and downloads it. */
  router.get('/backup/export', async (_req, res) => {
    const { name, path } = await backup.exportBackup();
    res.download(path, name);
  });

  router.get('/backup/files/:name', async (req, res) => {
    const { name } = parseParams(req, z.object({ name: z.string().max(80) }));
    res.download(await backup.storedBackupPath(name), name);
  });

  /** `?dryRun=true` reports the contents; a real restore also needs `?confirm=true`. */
  router.post('/backup/import', zipUpload, async (req, res) => {
    if (!req.file) throw new AppError('VALIDATION_ERROR', 'errors.fileRequired');
    res.json(await backup.importBackup(req.file.buffer, parseQuery(req, backupImportQuerySchema)));
  });

  return router;
}
