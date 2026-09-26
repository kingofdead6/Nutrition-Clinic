import { forbidden, unauthenticated } from '../lib/errors.js';
import { SESSION_COOKIE, verifySession } from '../lib/session.js';
import { toPublicUser } from '../services/userService.js';

/** @typedef {import('#shared').User} User */
/** @typedef {import('#shared').UserRole} UserRole */

/**
 * Requires a valid session cookie for an active user whose tokenVersion still matches
 * (password changes and deactivation revoke older sessions). Sets `res.locals.user`.
 * @param {import('../context.js').AppContext} ctx
 * @returns {import('express').RequestHandler}
 */
export function authenticate({ config, repositories }) {
  return async (req, res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    const claims = typeof token === 'string' ? verifySession(token, config) : null;
    if (!claims) return next(unauthenticated());
    const record = await repositories.users.findById(claims.sub);
    if (!record || !record.isActive || (record.tokenVersion ?? 0) !== claims.tv) {
      return next(unauthenticated());
    }
    res.locals.user = toPublicUser(record);
    next();
  };
}

/**
 * @param {...UserRole} roles
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...roles) {
  return (_req, res, next) => {
    const user = /** @type {User | undefined} */ (res.locals.user);
    if (!user) return next(unauthenticated());
    if (!roles.includes(user.role)) return next(forbidden());
    next();
  };
}

/**
 * The signed-in user (only valid after `authenticate`).
 * @param {import('express').Response} res
 * @returns {User}
 */
export function currentUser(res) {
  const user = /** @type {User | undefined} */ (res.locals.user);
  if (!user) throw unauthenticated();
  return user;
}
