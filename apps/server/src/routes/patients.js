import { Router } from 'express';
import { z } from 'zod';
import {
  idParamsSchema,
  idSchema,
  measurementCreateSchema,
  measurementUpdateSchema,
  patientArchiveSchema,
  patientCreateSchema,
  patientListQuerySchema,
  patientUpdateSchema,
} from '#shared';
import { imageUpload, mimeForKey, requireImage } from '../lib/upload.js';
import { parseBody, parseParams, parseQuery } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const measurementParamsSchema = z.object({ id: idSchema, measurementId: idSchema });

/**
 * Patients and their measurements. Every signed-in role may manage patients;
 * permanently deleting one is admin only (others archive).
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function patientsRouter(ctx, { patients, measurements }) {
  const router = Router();
  router.use('/patients', authenticate(ctx));

  router.get('/patients', async (req, res) => {
    res.json(await patients.list(parseQuery(req, patientListQuerySchema)));
  });

  router.post('/patients', async (req, res) => {
    res.status(201).json(await patients.create(parseBody(req, patientCreateSchema)));
  });

  router.get('/patients/:id', async (req, res) => {
    res.json(await patients.get(parseParams(req, idParamsSchema).id));
  });

  router.put('/patients/:id', async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await patients.update(id, parseBody(req, patientUpdateSchema)));
  });

  router.patch('/patients/:id/archive', async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await patients.setArchived(id, parseBody(req, patientArchiveSchema).archived));
  });

  router.delete('/patients/:id', requireRole('admin'), async (req, res) => {
    await patients.remove(parseParams(req, idParamsSchema).id);
    res.status(204).end();
  });

  // Photo: private (requires a session). The client cache-busts with ?v=<updatedAt>.
  router.get('/patients/:id/photo', async (req, res) => {
    const { key, path } = await patients.photoFile(parseParams(req, idParamsSchema).id);
    res.type(mimeForKey(key));
    res.set('Cache-Control', 'private, max-age=86400');
    res.sendFile(path);
  });

  router.post('/patients/:id/photo', imageUpload, async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await patients.setPhoto(id, requireImage(req)));
  });

  router.delete('/patients/:id/photo', async (req, res) => {
    res.json(await patients.removePhoto(parseParams(req, idParamsSchema).id));
  });

  // Measurements (one per visit) and the progress summary.
  router.get('/patients/:id/measurements', async (req, res) => {
    res.json({ data: await measurements.list(parseParams(req, idParamsSchema).id) });
  });

  router.post('/patients/:id/measurements', async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.status(201).json(await measurements.create(id, parseBody(req, measurementCreateSchema)));
  });

  router.put('/patients/:id/measurements/:measurementId', async (req, res) => {
    const { id, measurementId } = parseParams(req, measurementParamsSchema);
    res.json(await measurements.update(id, measurementId, parseBody(req, measurementUpdateSchema)));
  });

  router.delete('/patients/:id/measurements/:measurementId', async (req, res) => {
    const { id, measurementId } = parseParams(req, measurementParamsSchema);
    await measurements.remove(id, measurementId);
    res.status(204).end();
  });

  router.get('/patients/:id/progress', async (req, res) => {
    res.json(await measurements.progress(parseParams(req, idParamsSchema).id));
  });

  return router;
}
