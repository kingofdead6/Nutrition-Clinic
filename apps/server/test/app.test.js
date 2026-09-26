import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createRepositories } from '../src/repositories/index.js';
import { createTestConfig, createTestMongoRepositories } from './helpers.js';

describe('createApp', () => {
  /** @type {import('../src/repositories/index.js').Repositories} */
  let repositories;
  /** @type {import('express').Express} */
  let app;

  beforeAll(async () => {
    repositories = await createTestMongoRepositories();
    app = createApp({ repositories, config: createTestConfig() });
  });
  afterAll(() => repositories.db.close());

  it('GET /api/health reports ok with the driver', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', dbDriver: 'mongo', db: 'up' });
  });

  it('returns the standard error shape for unknown API routes', async () => {
    const res = await request(app).get('/api/does-not-exist').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'errors.routeNotFound' } });
  });

  it('returns a validation error for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('content-type', 'application/json')
      .send('{bad')
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('never leaks Express fingerprints', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('frontend on another site', () => {
  const FRONTEND = 'https://clinic-front.example';
  /** @type {import('../src/repositories/index.js').Repositories} */
  let repositories;
  /** @type {import('express').Express} */
  let app;

  beforeAll(async () => {
    repositories = await createTestMongoRepositories();
    app = createApp({
      repositories,
      config: createTestConfig({ RENDER: 'true', CORS_ORIGIN: FRONTEND }),
    });
  });
  afterAll(() => repositories.db.close());

  const setup = (origin) =>
    request(app)
      .post('/api/auth/setup')
      .set('Origin', origin)
      .send({
        admin: { name: 'Admin', email: 'admin@clinic.local', password: 'admin12345' },
        clinic: { clinicName: 'عيادة', practitionerName: 'د. سارة' },
      });

  it('refuses state-changing requests from other websites (CSRF)', async () => {
    const res = await setup('https://evil.example').expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(await repositories.users.count()).toBe(0);
  });

  it('accepts the frontend, with CORS headers and a cross-site session cookie', async () => {
    const res = await setup(FRONTEND).expect(201);
    expect(res.headers['access-control-allow-origin']).toBe(FRONTEND);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-expose-headers']).toContain('Content-Disposition');
    expect(res.headers['set-cookie']?.[0]).toMatch(/SameSite=None/i);
    expect(res.headers['set-cookie']?.[0]).toMatch(/; Secure/i);
    expect(res.headers['set-cookie']?.[0]).toMatch(/; Partitioned/i);
  });

  it('lets other sites load public images (logo, photos)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('still answers requests without an Origin (CLI, curl)', async () => {
    await request(app).post('/api/auth/logout').expect(204);
  });
});

describe('createRepositories', () => {
  it('refuses the sqlite driver until it is implemented', async () => {
    await expect(createRepositories(createTestConfig({ DB_DRIVER: 'sqlite' }))).rejects.toThrow(
      /not implemented/,
    );
  });
});
