import { Router } from 'express';
import { clinicSettingsUpdateSchema } from '#shared';
import { imageUpload, mimeForKey, requireImage } from '../lib/upload.js';
import { parseBody } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logoUrlFor } from '../services/settingsService.js';

/**
 * @param {import('#shared').ClinicSettings} settings
 */
const withLogoUrl = (settings) => ({ ...settings, logoUrl: logoUrlFor(settings) });

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function settingsRouter(ctx, { settings }) {
  const router = Router();
  const requireAuth = authenticate(ctx);
  const adminOnly = [requireAuth, requireRole('admin')];

  // Public: the login screen shows the logo before anyone signs in. The URL is versioned,
  // so the file can be cached forever.
  router.get('/settings/logo', async (_req, res) => {
    const { key, path } = await settings.logoFile();
    res.type(mimeForKey(key));
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(path);
  });

  router.get('/settings', requireAuth, async (_req, res) => {
    res.json(withLogoUrl(await settings.get()));
  });

  router.put('/settings', ...adminOnly, async (req, res) => {
    res.json(withLogoUrl(await settings.update(parseBody(req, clinicSettingsUpdateSchema))));
  });

  router.post('/settings/logo', ...adminOnly, imageUpload, async (req, res) => {
    res.json(withLogoUrl(await settings.setLogo(requireImage(req))));
  });

  router.delete('/settings/logo', ...adminOnly, async (_req, res) => {
    res.json(withLogoUrl(await settings.removeLogo()));
  });

  return router;
}
