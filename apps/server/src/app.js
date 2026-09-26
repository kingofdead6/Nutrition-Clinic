import { existsSync } from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { createLogger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { originCheck } from './middleware/originCheck.js';
import { apiRouter } from './routes/index.js';
import { createServices } from './services/index.js';
import { LocalFileStorage } from './storage/LocalFileStorage.js';

/**
 * @typedef {object} CreateAppOptions
 * @property {import('./repositories/index.js').Repositories} repositories
 * @property {import('./config.js').AppConfig} config
 * @property {import('./storage/StorageAdapter.js').StorageAdapter} [storage]
 * @property {import('./lib/logger.js').Logger} [logger]
 * @property {() => Date} [now]  Clock override; defaults to the system time.
 */

/**
 * Builds the Express app without connecting to anything or listening. The CLI
 * (`index.js`), the tests and, later, the Electron main process all call this and
 * decide themselves where to listen.
 *
 * @param {CreateAppOptions} options
 * @returns {import('express').Express}
 */
export function createApp({ repositories, config, storage, logger, now }) {
  const log = logger ?? createLogger(config);
  /** @type {import('./context.js').AppContext} */
  const ctx = {
    config,
    repositories,
    storage: storage ?? new LocalFileStorage(config.paths.uploadsDir),
    logger: log,
    now: now ?? (() => new Date()),
  };

  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:'],
          'upgrade-insecure-requests': null,
        },
      },
      crossOriginEmbedderPolicy: false,
      // The frontend may be on another site and loads photos / the logo from the API.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
      // Lets the frontend read download file names (backups) across origins.
      exposedHeaders: ['Content-Disposition'],
    }),
  );
  app.use('/api', originCheck(config.cors.origins));
  app.use(compression());
  app.use(
    pinoHttp({
      logger: log,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());

  const services = createServices(ctx);
  // Exposed so hosts (server.js, Electron) can run background jobs such as the status sweep.
  app.locals.services = services;
  app.locals.storage = ctx.storage;
  app.use('/api', apiRouter(ctx, services));

  // Single-origin mode (production / desktop): serve the built client with SPA fallback.
  const dist = config.paths.clientDistDir;
  if (dist && existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (!['GET', 'HEAD'].includes(req.method) || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(errorHandler(log));
  return app;
}
