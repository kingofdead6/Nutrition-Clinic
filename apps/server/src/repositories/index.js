import { assertRepositories } from './interfaces/index.js';

export { DuplicateKeyError } from './errors.js';
export { assertRepositories, REPOSITORY_CONTRACT } from './interfaces/index.js';

/** @typedef {import('./interfaces/index.js').Repositories} Repositories */

/**
 * Picks the storage driver from config (`DB_DRIVER=mongo|sqlite`). Drivers are loaded
 * lazily so a desktop build never has to load mongoose, and vice versa. The result is
 * checked against the repository contract, so an incomplete driver fails at startup.
 *
 * @param {Pick<import('../config.js').AppConfig, 'db'>} config
 * @returns {Promise<Repositories>}
 */
export async function createRepositories(config) {
  switch (config.db.driver) {
    case 'mongo': {
      const { createMongoRepositories } = await import('./mongo/index.js');
      return assertRepositories(await createMongoRepositories(config.db.mongoUri));
    }
    case 'sqlite':
      throw new Error(
        'DB_DRIVER=sqlite is not implemented yet (see src/repositories/sqlite/README.md)',
      );
    default:
      throw new Error(`Unknown DB_DRIVER: ${String(config.db.driver)}`);
  }
}
