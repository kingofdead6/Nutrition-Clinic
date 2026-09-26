import { pino } from 'pino';

/** @typedef {import('pino').Logger} Logger */

/**
 * @param {Pick<import('../config.js').AppConfig, 'log'>} config
 * @returns {Logger}
 */
export function createLogger(config) {
  return pino({
    level: config.log.level,
    redact: {
      paths: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.passwordHash'],
      remove: true,
    },
    ...(config.log.pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss' },
          },
        }
      : {}),
  });
}
