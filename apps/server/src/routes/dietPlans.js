import { Router } from 'express';
import {
  dietPlanCreateSchema,
  dietPlanDuplicateSchema,
  dietPlanListQuerySchema,
  dietPlanUpdateSchema,
  idParamsSchema,
} from '@clinic/shared';
import { parseBody, parseParams, parseQuery } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

/**
 * Diet plans (and templates). Every signed-in role reads; admins and nutritionists write.
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function dietPlansRouter(ctx, { dietPlans }) {
  const router = Router();
  const editors = requireRole('admin', 'nutritionist');
  const auth = authenticate(ctx);
  router.use('/diet-plans', auth);

  router.get('/patients/:id/diet-plans', auth, async (req, res) => {
    res.json({ data: await dietPlans.listForPatient(parseParams(req, idParamsSchema).id) });
  });

  router.get('/diet-plans', async (req, res) => {
    res.json(await dietPlans.list(parseQuery(req, dietPlanListQuerySchema)));
  });

  router.post('/diet-plans', editors, async (req, res) => {
    res.status(201).json(await dietPlans.create(parseBody(req, dietPlanCreateSchema)));
  });

  router.get('/diet-plans/:id', async (req, res) => {
    res.json(await dietPlans.get(parseParams(req, idParamsSchema).id));
  });

  router.put('/diet-plans/:id', editors, async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await dietPlans.update(id, parseBody(req, dietPlanUpdateSchema)));
  });

  router.post('/diet-plans/:id/activate', editors, async (req, res) => {
    res.json(await dietPlans.activate(parseParams(req, idParamsSchema).id));
  });

  router.post('/diet-plans/:id/deactivate', editors, async (req, res) => {
    res.json(await dietPlans.deactivate(parseParams(req, idParamsSchema).id));
  });

  router.post('/diet-plans/:id/duplicate', editors, async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.status(201).json(await dietPlans.duplicate(id, parseBody(req, dietPlanDuplicateSchema)));
  });

  router.delete('/diet-plans/:id', editors, async (req, res) => {
    await dietPlans.remove(parseParams(req, idParamsSchema).id);
    res.status(204).end();
  });

  return router;
}
