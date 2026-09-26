import { randomUUID } from 'node:crypto';
import { clinicSettingsInputSchema } from '#shared';
import { notFound } from '../lib/errors.js';

/** @typedef {import('#shared').ClinicSettings} ClinicSettings */

/** Full settings record with every default, for the first time settings are read. */
function defaultSettings() {
  return { ...clinicSettingsInputSchema.parse({}), logoPath: null, lastBackupAt: null };
}

/**
 * Cache-busted logo URL relative to the API base (the client prefixes it).
 * @param {ClinicSettings} settings
 */
export function logoUrlFor(settings) {
  return settings.logoPath ? `/settings/logo?v=${Date.parse(settings.updatedAt)}` : null;
}

/** @param {import('../context.js').AppContext} ctx */
export function createSettingsService({ repositories, storage, logger }) {
  const repo = repositories.settings;

  /** @returns {Promise<ClinicSettings>} */
  async function get() {
    return (await repo.get()) ?? repo.upsert(defaultSettings());
  }

  return {
    get,

    /** @param {import('#shared').ClinicSettingsUpdateInput} patch */
    async update(patch) {
      await get();
      return repo.upsert(patch);
    },

    /**
     * Stores a new logo and removes the previous file.
     * @param {{ buffer: Buffer, ext: string }} image
     */
    async setLogo(image) {
      const previous = (await get()).logoPath;
      const key = `logo/logo-${randomUUID()}.${image.ext}`;
      await storage.save(key, image.buffer);
      const updated = await repo.upsert({ logoPath: key });
      if (previous) {
        await storage
          .delete(previous)
          .catch((err) => logger.warn({ err }, 'Could not delete old logo'));
      }
      return updated;
    },

    async removeLogo() {
      const previous = (await get()).logoPath;
      const updated = await repo.upsert({ logoPath: null });
      if (previous) await storage.delete(previous);
      return updated;
    },

    /** @returns {Promise<{ key: string, path: string }>} */
    async logoFile() {
      const key = (await get()).logoPath;
      if (!key || !(await storage.exists(key))) throw notFound('logo');
      return { key, path: storage.getPath(key) };
    },
  };
}

/** @typedef {ReturnType<typeof createSettingsService>} SettingsService */
