import { mkdir } from 'node:fs/promises';
import { loadConfig } from '../config.js';
import { createLogger } from '../lib/logger.js';
import { createRepositories } from '../repositories/index.js';
import { createServices } from '../services/index.js';
import { LocalFileStorage } from '../storage/LocalFileStorage.js';

/**
 * Wires config, repositories, storage and services without an HTTP server, for the
 * command-line tools (seed, backup). Uses the same .env as the server.
 */
export async function openRuntime() {
  const config = loadConfig({ ...process.env, LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn' });
  const logger = createLogger(config);
  await Promise.all(
    [config.paths.dataDir, config.paths.uploadsDir, config.paths.backupDir].map((d) =>
      mkdir(d, { recursive: true }),
    ),
  );
  const repositories = await createRepositories(config);
  const storage = new LocalFileStorage(config.paths.uploadsDir);
  const ctx = { config, repositories, storage, logger, now: () => new Date() };
  const services = createServices(ctx);
  return { ...ctx, services, close: () => repositories.db.close() };
}

/** Database target for messages, without credentials. @param {import('../config.js').AppConfig} config */
export function describeDatabase(config) {
  if (config.db.driver !== 'mongo') return `${config.db.driver}: ${config.db.sqlitePath}`;
  try {
    const url = new URL(config.db.mongoUri);
    return `mongo: ${url.host}${url.pathname}`;
  } catch {
    return 'mongo';
  }
}
