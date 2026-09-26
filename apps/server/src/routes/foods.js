import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { foodCreateSchema, foodListQuerySchema, foodUpdateSchema, idParamsSchema } from '#shared';
import { AppError } from '../lib/errors.js';
import { parseBody, parseParams, parseQuery } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

/** CSV upload: one text file in the multipart field `file`, max 1 MB. */
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /\.csv$/i.test(file.originalname) ||
      ['text/csv', 'application/vnd.ms-excel', 'text/plain'].includes(file.mimetype);
    cb(ok ? null : new AppError('UNSUPPORTED_MEDIA_TYPE', 'errors.csvType'), ok);
  },
}).single('file');

const importQuerySchema = z.object({
  dryRun: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default(false),
});

/**
 * Food database: every signed-in role reads it; admins and nutritionists edit it.
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function foodsRouter(ctx, { foods }) {
  const router = Router();
  const editors = requireRole('admin', 'nutritionist');
  router.use('/foods', authenticate(ctx));

  router.get('/foods', async (req, res) => {
    res.json(await foods.list(parseQuery(req, foodListQuerySchema)));
  });

  router.post('/foods', editors, async (req, res) => {
    res.status(201).json(await foods.create(parseBody(req, foodCreateSchema)));
  });

  router.post('/foods/import', editors, csvUpload, async (req, res) => {
    if (!req.file) throw new AppError('VALIDATION_ERROR', 'errors.fileRequired');
    const { dryRun } = parseQuery(req, importQuerySchema);
    res.json(await foods.importCsv(req.file.buffer.toString('utf8'), { dryRun }));
  });

  router.post('/foods/defaults', editors, async (_req, res) => {
    res.json(await foods.installDefaults());
  });

  router.get('/foods/:id', async (req, res) => {
    res.json(await foods.get(parseParams(req, idParamsSchema).id));
  });

  router.put('/foods/:id', editors, async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await foods.update(id, parseBody(req, foodUpdateSchema)));
  });

  router.delete('/foods/:id', editors, async (req, res) => {
    await foods.remove(parseParams(req, idParamsSchema).id);
    res.status(204).end();
  });

  return router;
}
