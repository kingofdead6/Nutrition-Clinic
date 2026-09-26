import { Router } from 'express';
import { apiNotFound } from '../middleware/errorHandler.js';
import { appointmentsRouter } from './appointments.js';
import { authRouter } from './auth.js';
import { backupRouter } from './backup.js';
import { dashboardRouter } from './dashboard.js';
import { dietPlansRouter } from './dietPlans.js';
import { foodsRouter } from './foods.js';
import { healthRouter } from './health.js';
import { patientsRouter } from './patients.js';
import { prescriptionsRouter } from './prescriptions.js';
import { reportsRouter } from './reports.js';
import { settingsRouter } from './settings.js';
import { usersRouter } from './users.js';

/**
 * Everything mounted under `/api`. Public routes: health, auth status/setup/login/logout,
 * and the clinic logo; everything else requires a session (see middleware/auth.js).
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function apiRouter(ctx, services) {
  const router = Router();
  router.use(healthRouter(ctx));
  router.use(authRouter(ctx, services));
  router.use(settingsRouter(ctx, services));
  router.use(usersRouter(ctx, services));
  router.use(patientsRouter(ctx, services));
  router.use(appointmentsRouter(ctx, services));
  router.use(dashboardRouter(ctx, services));
  router.use(foodsRouter(ctx, services));
  router.use(dietPlansRouter(ctx, services));
  router.use(prescriptionsRouter(ctx, services));
  router.use(reportsRouter(ctx, services));
  router.use(backupRouter(ctx, services));
  router.use(apiNotFound);
  return router;
}
