/**
 * Dependencies handed to every router/service factory.
 * @typedef {object} AppContext
 * @property {import('./config.js').AppConfig} config
 * @property {import('./repositories/index.js').Repositories} repositories
 * @property {import('./storage/StorageAdapter.js').StorageAdapter} storage
 * @property {import('./lib/logger.js').Logger} logger
 * @property {() => Date} now  The clock (injectable so tests and hosts can pin "today").
 */

export {};
