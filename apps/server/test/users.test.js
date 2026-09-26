import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
});
afterEach(() => t.repositories.db.close());

const assistant = {
  name: 'Amina',
  email: 'amina@clinic.local',
  password: 'assist-123',
  role: 'assistant',
};

describe('/api/users (admin only)', () => {
  it('creates and lists users without password hashes', async () => {
    const created = await admin.post('/api/users').send(assistant).expect(201);
    expect(created.body).toMatchObject({
      email: assistant.email,
      role: 'assistant',
      isActive: true,
    });
    const list = await admin.get('/api/users').expect(200);
    expect(list.body.data).toHaveLength(2);
    expect(JSON.stringify(list.body)).not.toMatch(/passwordHash|tokenVersion/);
  });

  it('rejects a duplicate email with 409', async () => {
    await admin.post('/api/users').send(assistant).expect(201);
    const res = await admin.post('/api/users').send(assistant).expect(409);
    expect(res.body.error.message).toBe('errors.emailTaken');
  });

  it('forbids non-admins and anonymous callers', async () => {
    await admin.post('/api/users').send(assistant).expect(201);
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(assistant).expect(200);
    await agent.get('/api/users').expect(403);
    await request(t.app).get('/api/users').expect(401);
  });

  it('a partial update changes only the given fields (no default injection)', async () => {
    const { body: u } = await admin.post('/api/users').send(assistant).expect(201);
    const res = await admin.put(`/api/users/${u.id}`).send({ name: 'Amina B.' }).expect(200);
    expect(res.body).toMatchObject({ name: 'Amina B.', role: 'assistant', isActive: true });
  });

  it('deactivating a user ends their session and blocks login', async () => {
    const { body: u } = await admin.post('/api/users').send(assistant).expect(201);
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(assistant).expect(200);
    await admin.put(`/api/users/${u.id}`).send({ isActive: false }).expect(200);
    await agent.get('/api/auth/me').expect(401);
    const res = await request(t.app).post('/api/auth/login').send(assistant).expect(403);
    expect(res.body.error.message).toBe('errors.accountDisabled');
  });

  it('never leaves the clinic without an active admin', async () => {
    const me = (await admin.get('/api/auth/me')).body.user;
    await admin
      .put(`/api/users/${me.id}`)
      .send({ role: 'nutritionist' })
      .expect(409)
      .expect((r) => expect(r.body.error.message).toBe('errors.lastAdmin'));
    await admin
      .put(`/api/users/${me.id}`)
      .send({ isActive: false })
      .expect(409)
      .expect((r) => expect(r.body.error.message).toBe('errors.cannotDisableSelf'));
    await admin.delete(`/api/users/${me.id}`).expect(409);

    // With a second admin, demoting the first is allowed.
    await admin
      .post('/api/users')
      .send({ ...assistant, role: 'admin' })
      .expect(201);
    await admin.put(`/api/users/${me.id}`).send({ role: 'nutritionist' }).expect(200);
  });

  it('deletes a user and 404s on unknown ids', async () => {
    const { body: u } = await admin.post('/api/users').send(assistant).expect(201);
    await admin.delete(`/api/users/${u.id}`).expect(204);
    await admin.delete(`/api/users/${u.id}`).expect(404);
    await admin.put('/api/users/not-a-uuid').send({ name: 'x' }).expect(400);
  });
});
