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

  it('listens on all interfaces when hosted, unless HOST is set', () => {
    expect(loadConfig({ RENDER: 'true' }).host).toBe('0.0.0.0');
    expect(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) }).host).toBe('0.0.0.0');
    expect(loadConfig({ RENDER: 'true', HOST: '127.0.0.1' }).host).toBe('127.0.0.1');
  });

  it('parses CORS origins and booleans', () => {
    const c = loadConfig({ CORS_ORIGIN: 'http://a, http://b/', COOKIE_SECURE: 'true', PORT: '0' });
    expect(c.cors.origins).toEqual([
      'https://nutrition-clinic-client.vercel.app',
      'http://localhost:5173',
      'http://a',
      'http://b',
    ]);
    expect(c.auth.cookieSecure).toBe(true);
    expect(c.auth.cookieSameSite).toBe('strict');
    expect(c.port).toBe(0);
  });

  it('ignores a "*" origin (unsafe with cookie auth)', () => {
    const c = loadConfig({ CORS_ORIGIN: '*' });
    expect(c.cors).toEqual({
      origins: ['https://nutrition-clinic-client.vercel.app', 'http://localhost:5173'],
      ignoredWildcard: true,
    });
  });

  it('on Render: cross-site Secure cookie and a trusted proxy, unless overridden', () => {
    const c = loadConfig({ RENDER: 'true' });
    expect(c.auth).toMatchObject({ cookieSameSite: 'none', cookieSecure: true });
    expect(c.trustProxy).toBe(true);
    const same = loadConfig({ RENDER: 'true', COOKIE_SAMESITE: 'strict', TRUST_PROXY: 'false' });
    expect(same.auth).toMatchObject({ cookieSameSite: 'strict', cookieSecure: false });
    expect(same.trustProxy).toBe(false);
  });

  it('requires a JWT secret in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32) })).not.toThrow();
  });

  it('rejects invalid values with a readable message', () => {
    expect(() => loadConfig({ DB_DRIVER: 'postgres' })).toThrow(/DB_DRIVER/);
  });
});
