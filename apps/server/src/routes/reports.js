import { Router } from 'express';
import { idParamsSchema, reportRangeQuerySchema } from '#shared';
import { parseParams, parseQuery } from '../lib/validate.js';
import { authenticate } from '../middleware/auth.js';

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function reportsRouter(ctx, { reports }) {
  const router = Router();
  router.use('/reports', authenticate(ctx));

  router.get('/reports/overview', async (req, res) => {
    res.json(await reports.overview(parseQuery(req, reportRangeQuerySchema)));
  });

  router.get('/reports/patient/:id', async (req, res) => {
    res.json(await reports.patient(parseParams(req, idParamsSchema).id));
  });

  return router;
}
