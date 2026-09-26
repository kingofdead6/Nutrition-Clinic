import path from 'node:path';
import { z } from 'zod';
import { DB_DRIVERS } from '#shared';

/**
 * Frontends that may always use the API with the session cookie: the deployed site
 * (Vercel) and the Vite dev server. CORS_ORIGIN can add more.
 */
const CLIENT_ORIGINS = ['https://nutrition-clinic-client.vercel.app', 'http://localhost:5173'];
const DEV_JWT_SECRET = 'dev-only-insecure-secret-change-me-0123456789';

const booleanFromEnv = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Default: 127.0.0.1 locally; 0.0.0.0 on hosting platforms (see defaultHost). */
  HOST: z.string().optional(),
  /** 0 = pick a random free port (the desktop shell may do this as a fallback). */
  PORT: z.coerce.number().int().min(0).max(65535).default(4000),

  DB_DRIVER: z.enum(DB_DRIVERS).default('mongo'),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/nutrition_clinic'),
  /** Used by the future SQLite driver. Defaults to `<DATA_DIR>/clinic.db`. */
  SQLITE_PATH: z.string().optional(),

  /** Root folder for everything the app writes: uploads, backups, local DB file. */
  DATA_DIR: z.string().default('./data'),
  UPLOADS_DIR: z.string().optional(),
  BACKUP_DIR: z.string().optional(),

  /**
   * Comma-separated browser origins allowed to call the API with the session cookie (the
   * frontend's address). The local Vite dev server is always allowed. `*` is ignored: with
   * cookie auth it would let any website act as the signed-in user.
   */
  CORS_ORIGIN: z.string().default(''),
  /** When set, the server also serves the built client from this folder (single origin). */
  CLIENT_DIST_DIR: z.string().optional(),

  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN_HOURS: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 90)
    .default(24 * 7),
  /** Failed logins allowed per IP per window before 429. */
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  LOGIN_RATE_LIMIT_WINDOW_MIN: z.coerce.number().int().min(1).default(15),
  /** bcrypt cost factor (tests lower it for speed). */
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  COOKIE_SECURE: booleanFromEnv.optional(),
  /**
   * strict: frontend and API on the same site. none: frontend on another site (the cookie
   * is then also Secure and Partitioned). Default: none on Render, strict elsewhere.
   */
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).optional(),
  TRUST_PROXY: booleanFromEnv.optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_PRETTY: booleanFromEnv.optional(),
});

/**
 * Builds the config from an env-like object. The CLI passes `process.env`; the desktop
 * shell can pass its own values (e.g. DATA_DIR in the OS app-data folder, PORT=0).
 * Relative paths are resolved against `baseDir` (defaults to the process cwd).
 *
 * @param {Record<string, string | undefined>} [source]
 * @param {string} [baseDir]
 */
/**
 * Locally the API only listens on 127.0.0.1 (not reachable from the network). Hosting
 * platforms route traffic to the container's public interface, so there it must be
 * 0.0.0.0. Render sets RENDER=true; production builds are assumed to be hosted.
 * @param {Record<string, string | undefined>} source
 * @param {string} nodeEnv
 */
function defaultHost(source, nodeEnv) {
  return source.RENDER || nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1';
}

export function loadConfig(source = process.env, baseDir = process.cwd()) {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid configuration:\n${lines.join('\n')}`);
  }
  const e = parsed.data;

  if (e.NODE_ENV === 'production' && !e.JWT_SECRET) {
    throw new Error('Invalid configuration: JWT_SECRET (≥32 chars) is required in production');
  }

  const hosted = Boolean(source.RENDER);
  const sameSite = e.COOKIE_SAMESITE ?? (hosted ? 'none' : 'strict');

  /** @param {string} p */
  const resolve = (p) => path.resolve(baseDir, p);
  const dataDir = resolve(e.DATA_DIR);

  return {
    env: e.NODE_ENV,
    host: e.HOST ?? defaultHost(source, e.NODE_ENV),
    port: e.PORT,
    db: {
      driver: e.DB_DRIVER,
      mongoUri: e.MONGO_URI,
      sqlitePath: e.SQLITE_PATH ? resolve(e.SQLITE_PATH) : path.join(dataDir, 'clinic.db'),
    },
    paths: {
      dataDir,
      uploadsDir: e.UPLOADS_DIR ? resolve(e.UPLOADS_DIR) : path.join(dataDir, 'uploads'),
      backupDir: e.BACKUP_DIR ? resolve(e.BACKUP_DIR) : path.join(dataDir, 'backups'),
      /** @type {string | null} */
      clientDistDir: e.CLIENT_DIST_DIR ? resolve(e.CLIENT_DIST_DIR) : null,
    },
    cors: {
      origins: [
        ...new Set([
          ...CLIENT_ORIGINS,
          ...e.CORS_ORIGIN.split(',')
            .map((o) => o.trim().replace(/\/+$/, ''))
            .filter((o) => o && o !== '*'),
        ]),
      ],
      ignoredWildcard: e.CORS_ORIGIN.split(',').some((o) => o.trim() === '*'),
    },
    auth: {
      jwtSecret: e.JWT_SECRET ?? DEV_JWT_SECRET,
      jwtExpiresInHours: e.JWT_EXPIRES_IN_HOURS,
      cookieSameSite: sameSite,
      // Browsers only accept SameSite=None cookies when they are Secure.
      cookieSecure: sameSite === 'none' ? true : (e.COOKIE_SECURE ?? false),
      bcryptRounds: e.BCRYPT_ROUNDS,
      loginRateLimit: { max: e.LOGIN_RATE_LIMIT_MAX, windowMin: e.LOGIN_RATE_LIMIT_WINDOW_MIN },
      /** True when running on the built-in dev secret (warn loudly). */
      usingDevSecret: !e.JWT_SECRET,
    },
    // Render (and similar hosts) sit behind one proxy hop.
    trustProxy: e.TRUST_PROXY ?? hosted,
    log: {
      level: e.NODE_ENV === 'test' ? 'silent' : e.LOG_LEVEL,
      pretty: e.LOG_PRETTY ?? e.NODE_ENV === 'development',
    },
  };
}

/** @typedef {ReturnType<typeof loadConfig>} AppConfig */
