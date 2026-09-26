import { Router } from 'express';
import { APP_VERSION } from '@clinic/shared';

/** @param {import('../context.js').AppContext} ctx */
export function healthRouter({ repositories }) {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const up = await repositories.db.ping();
    /** @type {import('@clinic/shared').HealthResponse} */
    const body = {
      status: up ? 'ok' : 'degraded',
      version: APP_VERSION,
      dbDriver: repositories.db.driver,
      db: up ? 'up' : 'down',
      time: new Date().toISOString(),
    };
    res.status(up ? 200 : 503).json(body);
  });

  return router;
}
