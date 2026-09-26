import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function dashboardRouter(ctx, { dashboard }) {
  const router = Router();
  router.get('/dashboard/stats', authenticate(ctx), async (_req, res) => {
    res.json(await dashboard.stats());
  });
  return router;
}
