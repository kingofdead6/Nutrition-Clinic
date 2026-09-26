import { Router } from 'express';
import {
  appointmentCreateSchema,
  appointmentListQuerySchema,
  appointmentStatusUpdateSchema,
  appointmentUpdateSchema,
  idParamsSchema,
  upcomingQuerySchema,
} from '#shared';
import { parseBody, parseParams, parseQuery } from '../lib/validate.js';
import { authenticate } from '../middleware/auth.js';

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function appointmentsRouter(ctx, { appointments }) {
  const router = Router();
  router.use('/appointments', authenticate(ctx));

  router.get('/appointments', async (req, res) => {
    res.json(await appointments.list(parseQuery(req, appointmentListQuerySchema)));
  });

  // Registered before /:id so "today" and "upcoming" are not read as ids.
  router.get('/appointments/today', async (_req, res) => {
    res.json({ data: await appointments.today() });
  });

  router.get('/appointments/upcoming', async (req, res) => {
    res.json({ data: await appointments.upcoming(parseQuery(req, upcomingQuerySchema).limit) });
  });

  router.post('/appointments', async (req, res) => {
    res.status(201).json(await appointments.create(parseBody(req, appointmentCreateSchema)));
  });

  router.get('/appointments/:id', async (req, res) => {
    res.json(await appointments.get(parseParams(req, idParamsSchema).id));
  });

  router.put('/appointments/:id', async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await appointments.update(id, parseBody(req, appointmentUpdateSchema)));
  });

  router.patch('/appointments/:id/status', async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(
      await appointments.setStatus(id, parseBody(req, appointmentStatusUpdateSchema).status),
    );
  });

  router.delete('/appointments/:id', async (req, res) => {
    await appointments.remove(parseParams(req, idParamsSchema).id);
    res.status(204).end();
  });

  return router;
}
