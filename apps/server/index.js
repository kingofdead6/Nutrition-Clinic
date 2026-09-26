/**
 * Run file: `node index.js` (or `npm run dev` / `npm start`).
 * Loads config from the environment, connects, listens. All wiring lives in
 * `src/app.js` / `src/server.js` so other hosts (tests, Electron) can reuse it.
 */
import 'dotenv/config';
import { loadConfig } from './src/config.js';
import { createLogger } from './src/lib/logger.js';
import { startServer } from './src/server.js';

const config = loadConfig();
const logger = createLogger(config);

if (config.cors.ignoredWildcard) {
  logger.warn('CORS_ORIGIN "*" is ignored: list the frontend address(es) instead');
}
logger.info(
  { allowedOrigins: config.cors.origins, cookieSameSite: config.auth.cookieSameSite },
  'Browser access',
);

if (config.auth.usingDevSecret) {
  logger.warn('JWT_SECRET is not set: using the insecure development secret');
}

try {
  const server = await startServer(config, logger);
  logger.info(
    { dbDriver: config.db.driver, dataDir: config.paths.dataDir },
    `Server listening on ${server.url}`,
  );

  let stopping = false;
  /** @param {string} signal */
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    logger.info(`${signal} received, shutting down`);
    await server.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
} catch (err) {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
}
