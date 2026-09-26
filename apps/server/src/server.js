import { mkdir } from 'node:fs/promises';
import { createApp } from './app.js';
import { createLogger } from './lib/logger.js';
import { createRepositories } from './repositories/index.js';

/**
 * @typedef {object} RunningServer
 * @property {string} url
 * @property {number} port
 * @property {() => Promise<void>} close
 */

/**
 * Connects storage, builds the app and listens. Returns the actual port, so a caller
 * may pass PORT=0 and get a random free one (the Electron shell's fallback).
 *
 * @param {import('./config.js').AppConfig} config
 * @param {import('./lib/logger.js').Logger} [logger]
 * @returns {Promise<RunningServer>}
 */
export async function startServer(config, logger = createLogger(config)) {
  await Promise.all(
    [config.paths.dataDir, config.paths.uploadsDir, config.paths.backupDir].map((dir) =>
      mkdir(dir, { recursive: true }),
    ),
  );

  const repositories = await createRepositories(config);
  const app = createApp({ repositories, config, logger });

  /** @type {import('node:http').Server} */
  let server;
  try {
    server = await new Promise((resolve, reject) => {
      // Express 5 passes listen errors (e.g. EADDRINUSE) to this callback.
      const s = app.listen(config.port, config.host, (err) => (err ? reject(err) : resolve(s)));
    });
  } catch (err) {
    await repositories.db.close();
    throw err;
  }

  const { port } = /** @type {import('node:net').AddressInfo} */ (server.address());
  const stopSweep = scheduleStatusSweep(
    /** @type {import('./services/index.js').Services} */ (app.locals.services),
    logger,
  );
  return {
    url: `http://${config.host}:${port}`,
    port,
    async close() {
      stopSweep();
      await new Promise((resolve) => server.close(() => resolve(undefined)));
      await repositories.db.close();
    },
  };
}

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Patient statuses depend on the calendar ("plan ended", "inactive"), so they are
 * recomputed at startup and then hourly, not only when a patient is edited.
 * @param {import('./services/index.js').Services} services
 * @param {import('./lib/logger.js').Logger} logger
 * @returns {() => void} stops the schedule
 */
export function scheduleStatusSweep(services, logger) {
  const run = () =>
    services.patients
      .refreshAllStatuses()
      .then((changed) => changed > 0 && logger.info({ changed }, 'Patient statuses refreshed'))
      .catch((err) => logger.error({ err }, 'Patient status sweep failed'));
  void run();
  const timer = setInterval(run, SWEEP_INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}
