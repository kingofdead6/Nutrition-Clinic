import { rateLimit } from 'express-rate-limit';
import { Router } from 'express';
import { loginSchema, passwordChangeSchema, profileUpdateSchema, setupSchema } from '#shared';
import { AppError } from '../lib/errors.js';
import { clearSessionCookie, setSessionCookie } from '../lib/session.js';
import { parseBody } from '../lib/validate.js';
import { authenticate, currentUser } from '../middleware/auth.js';
import { toPublicUser } from '../services/userService.js';

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function authRouter(ctx, { auth, users }) {
  const { config } = ctx;
  const router = Router();
  const requireAuth = authenticate(ctx);

  // Only failed attempts count, so a clinic signing in all day is never locked out.
  const loginLimiter = rateLimit({
    windowMs: config.auth.loginRateLimit.windowMin * 60_000,
    limit: config.auth.loginRateLimit.max,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new AppError('RATE_LIMITED', 'errors.rateLimited')),
  });

  router.get('/auth/status', async (_req, res) => {
    res.json(await auth.status());
  });

  router.post('/auth/setup', async (req, res) => {
    const admin = await auth.setup(parseBody(req, setupSchema));
    setSessionCookie(res, admin, config);
    res.status(201).json({ user: toPublicUser(admin) });
  });

  router.post('/auth/login', loginLimiter, async (req, res) => {
    const record = await auth.login(parseBody(req, loginSchema));
    setSessionCookie(res, record, config);
    res.json({ user: toPublicUser(record) });
  });

  router.post('/auth/logout', (_req, res) => {
    clearSessionCookie(res, config);
    res.status(204).end();
  });

  router.get('/auth/me', requireAuth, (_req, res) => {
    res.json({ user: currentUser(res) });
  });

  router.put('/auth/me', requireAuth, async (req, res) => {
    const user = await users.updateProfile(
      currentUser(res).id,
      parseBody(req, profileUpdateSchema),
    );
    res.json({ user });
  });

  router.put('/auth/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = parseBody(req, passwordChangeSchema);
    const record = await users.changePassword(currentUser(res).id, {
      currentPassword,
      newPassword,
    });
    // Other sessions are revoked by the tokenVersion bump; keep this one signed in.
    setSessionCookie(res, record, config);
    res.status(204).end();
  });

  return router;
}
