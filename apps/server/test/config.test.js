import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('derives paths from DATA_DIR and resolves them against the base dir', () => {
    const c = loadConfig({ DATA_DIR: 'store' }, '/app');
    expect(c.paths.dataDir).toBe(path.resolve('/app', 'store'));
    expect(c.paths.uploadsDir).toBe(path.join(c.paths.dataDir, 'uploads'));
    expect(c.paths.backupDir).toBe(path.join(c.paths.dataDir, 'backups'));
    expect(c.db.sqlitePath).toBe(path.join(c.paths.dataDir, 'clinic.db'));
    expect(c.db.driver).toBe('mongo');
    expect(c.host).toBe('127.0.0.1');
  });

  it('parses CORS origins and booleans', () => {
    const c = loadConfig({ CORS_ORIGIN: 'http://a, http://b', COOKIE_SECURE: 'true', PORT: '0' });
    expect(c.cors.origins).toEqual(['http://a', 'http://b']);
    expect(c.auth.cookieSecure).toBe(true);
    expect(c.port).toBe(0);
  });

  it('requires a JWT secret in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) })).not.toThrow();
  });

  it('rejects invalid values with a readable message', () => {
    expect(() => loadConfig({ DB_DRIVER: 'postgres' })).toThrow(/DB_DRIVER/);
  });
});
