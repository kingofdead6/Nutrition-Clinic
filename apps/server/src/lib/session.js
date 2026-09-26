import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'clinic_session';

/**
 * @typedef {object} SessionClaims
 * @property {string} sub  User id.
 * @property {number} tv  The user's tokenVersion when issued; bumping it revokes old sessions.
 */

/**
 * @param {{ id: string, tokenVersion: number }} user
 * @param {import('../config.js').AppConfig} config
 */
export function signSession(user, config) {
  return jwt.sign({ tv: user.tokenVersion }, config.auth.jwtSecret, {
    subject: user.id,
    expiresIn: `${config.auth.jwtExpiresInHours}h`,
    algorithm: 'HS256',
  });
}

/**
 * @param {string} token
 * @param {import('../config.js').AppConfig} config
 * @returns {SessionClaims | null}
 */
export function verifySession(token, config) {
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, tv: typeof payload.tv === 'number' ? payload.tv : -1 };
  } catch {
    return null;
  }
}

/** @param {import('../config.js').AppConfig} config */
function cookieOptions(config) {
  const crossSite = config.auth.cookieSameSite === 'none';
  return /** @type {const} */ ({
    httpOnly: true,
    sameSite: config.auth.cookieSameSite,
    secure: config.auth.cookieSecure,
    // Frontend on another site: a partitioned (CHIPS) cookie is still accepted by browsers
    // that block ordinary third-party cookies.
    partitioned: crossSite,
    path: '/',
  });
}

/**
 * @param {import('express').Response} res
 * @param {{ id: string, tokenVersion: number }} user
 * @param {import('../config.js').AppConfig} config
 */
export function setSessionCookie(res, user, config) {
  res.cookie(SESSION_COOKIE, signSession(user, config), {
    ...cookieOptions(config),
    maxAge: config.auth.jwtExpiresInHours * 3600 * 1000,
  });
}

/**
 * @param {import('express').Response} res
 * @param {import('../config.js').AppConfig} config
 */
export function clearSessionCookie(res, config) {
  res.clearCookie(SESSION_COOKIE, cookieOptions(config));
}
