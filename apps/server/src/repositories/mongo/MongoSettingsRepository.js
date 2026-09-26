import { MongoCrudRepository } from './MongoCrudRepository.js';

/** @typedef {import('@clinic/shared').ClinicSettings} ClinicSettings */

/**
 * @extends {MongoCrudRepository<ClinicSettings>}
 * @implements {import('../interfaces/SettingsRepository.js').SettingsRepository}
 */
export class MongoSettingsRepository extends MongoCrudRepository {
  async get() {
    const [first] = await this.findMany({}, { createdAt: 1 }, { limit: 1 });
    return first ?? null;
  }

  /** @param {Partial<import('../interfaces/common.js').NewEntity<ClinicSettings>>} data */
  async upsert(data) {
    const current = await this.get();
    const updated = current ? await this.update(current.id, data) : null;
    return (
      updated ??
      this.create(/** @type {import('../interfaces/common.js').NewEntity<ClinicSettings>} */ (data))
    );
  }

  /** @param {readonly ClinicSettings[]} records */
  importAll(records) {
    return super.importAll(records.slice(0, 1));
  }
}
