import { forbidden } from '../lib/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF guard. When the frontend lives on another site, the session cookie is sent
 * cross-site (SameSite=None), so any website could make the browser submit a form or a
 * no-cors upload to the API. Browsers always send `Origin` on such requests: refuse
 * state-changing requests whose Origin is neither an allowed frontend nor this server.
 * Requests without Origin (curl, the CLI, same-origin GETs) are not from another site.
 * @param {readonly string[]} allowedOrigins
 * @returns {import('express').RequestHandler}
 */
export function originCheck(allowedOrigins) {
  const allowed = new Set(allowedOrigins);
  return (req, _res, next) => {
    const origin = req.get('origin');
    if (SAFE_METHODS.has(req.method) || !origin || allowed.has(origin)) return next();
    // Same origin (the server also serves the client): compare with this request's host.
    try {
      if (new URL(origin).host === req.get('host')) return next();
    } catch {
      // Malformed Origin ("null", garbage): refuse.
    }
    next(forbidden());
  };
}
