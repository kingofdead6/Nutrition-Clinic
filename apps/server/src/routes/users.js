import { Router } from 'express';
import { idParamsSchema, userCreateSchema, userUpdateSchema } from '@clinic/shared';
import { parseBody, parseParams } from '../lib/validate.js';
import { authenticate, currentUser, requireRole } from '../middleware/auth.js';

/**
 * User management: admin only.
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function usersRouter(ctx, { users }) {
  const router = Router();
  router.use('/users', authenticate(ctx), requireRole('admin'));

  router.get('/users', async (_req, res) => {
    res.json({ data: await users.list() });
  });

  router.post('/users', async (req, res) => {
    res.status(201).json(await users.create(parseBody(req, userCreateSchema)));
  });

  router.put('/users/:id', async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await users.update(currentUser(res), id, parseBody(req, userUpdateSchema)));
  });

  router.delete('/users/:id', async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    await users.remove(currentUser(res), id);
    res.status(204).end();
  });

  return router;
}
