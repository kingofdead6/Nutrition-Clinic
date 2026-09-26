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

describe('createRepositories', () => {
  it('refuses the sqlite driver until it is implemented', async () => {
    await expect(createRepositories(createTestConfig({ DB_DRIVER: 'sqlite' }))).rejects.toThrow(
      /not implemented/,
    );
  });
});
