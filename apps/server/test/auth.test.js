import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;

beforeEach(async () => {
  t = await createTestApp();
});
afterEach(() => t.repositories.db.close());

const cookieOf = (/** @type {request.Response} */ res) =>
  /** @type {string[]} */ ([res.headers['set-cookie'] ?? []].flat()).join(';');

describe('first-run setup', () => {
  it('reports setupRequired until an admin exists, with default clinic branding', async () => {
    const res = await request(t.app).get('/api/auth/status').expect(200);
    expect(res.body).toEqual({
      setupRequired: true,
      clinic: {
        clinicName: 'عيادة التغذية',
        tagline: 'صحتك ... توازن حياتك',
        practitionerTitle: 'أخصائية التغذية',
        timezone: 'Africa/Algiers',
        locale: 'ar',
        logoUrl: null,
      },
    });
  });

  it('creates the admin + clinic settings, signs in, and cannot run twice', async () => {
    const res = await request(t.app)
      .post('/api/auth/setup')
      .send({ admin: ADMIN, clinic: { clinicName: 'عيادتي', practitionerName: 'د. سارة' } })
      .expect(201);
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'admin', isActive: true });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(cookieOf(res)).toMatch(/clinic_session=.+HttpOnly.*SameSite=Strict/i);

    const status = await request(t.app).get('/api/auth/status').expect(200);
    expect(status.body.setupRequired).toBe(false);
    expect(status.body.clinic.clinicName).toBe('عيادتي');

    await request(t.app)
      .post('/api/auth/setup')
      .send({ admin: { ...ADMIN, email: 'other@clinic.local' }, clinic: {} })
      .expect(409)
      .expect((r) => expect(r.body.error.message).toBe('errors.setupDone'));
  });

  it('validates the setup body', async () => {
    const res = await request(t.app)
      .post('/api/auth/setup')
      .send({ admin: { name: '', email: 'bad', password: '123' }, clinic: {} })
      .expect(400);
    const paths = res.body.error.details.map((/** @type {{ path: string }} */ d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['admin.name', 'admin.email', 'admin.password']));
  });
});

describe('login / session', () => {
  beforeEach(async () => {
    await setupAdmin(t.app);
  });

  it('logs in with valid credentials (email is case-insensitive) and /me works with the cookie', async () => {
    const agent = request.agent(t.app);
    const res = await agent
      .post('/api/auth/login')
      .send({ email: 'ADMIN@clinic.local', password: ADMIN.password })
      .expect(200);
    expect(res.body.user.email).toBe(ADMIN.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.role).toBe('admin');
  });

  it('rejects wrong passwords and unknown emails with the same error', async () => {
    const a = await request(t.app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'wrong-password' })
      .expect(401);
    const b = await request(t.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@clinic.local', password: 'wrong-password' })
      .expect(401);
    expect(a.body).toEqual(b.body);
    expect(a.body.error.message).toBe('errors.invalidCredentials');
  });

  it('requires a session for /me and rejects a tampered cookie', async () => {
    await request(t.app).get('/api/auth/me').expect(401);
    await request(t.app)
      .get('/api/auth/me')
      .set('Cookie', 'clinic_session=abc.def.ghi')
      .expect(401);
  });

  it('logout clears the cookie', async () => {
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(ADMIN).expect(200);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('changing the password revokes other sessions but keeps the current one', async () => {
    const phone = request.agent(t.app);
    const laptop = request.agent(t.app);
    await phone.post('/api/auth/login').send(ADMIN).expect(200);
    await laptop.post('/api/auth/login').send(ADMIN).expect(200);

    await laptop
      .put('/api/auth/password')
      .send({
        currentPassword: 'nope-nope',
        newPassword: 'new-pass-123',
        confirmPassword: 'new-pass-123',
      })
      .expect(400);
    await laptop
      .put('/api/auth/password')
      .send({
        currentPassword: ADMIN.password,
        newPassword: 'new-pass-123',
        confirmPassword: 'new-pass-123',
      })
      .expect(204);

    await laptop.get('/api/auth/me').expect(200);
    await phone.get('/api/auth/me').expect(401);
    await request(t.app).post('/api/auth/login').send(ADMIN).expect(401);
    await request(t.app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'new-pass-123' })
      .expect(200);
  });

  it('updates the profile', async () => {
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(ADMIN).expect(200);
    const res = await agent
      .put('/api/auth/me')
      .send({ name: 'سارة', email: 'sara@clinic.local' })
      .expect(200);
    expect(res.body.user).toMatchObject({ name: 'سارة', email: 'sara@clinic.local' });
  });
});

describe('login rate limit', () => {
  it('returns 429 after too many failed attempts from one IP', async () => {
    const limited = await createTestApp({ LOGIN_RATE_LIMIT_MAX: '3' });
    try {
      await setupAdmin(limited.app);
      const bad = { email: ADMIN.email, password: 'wrong-password' };
      for (let i = 0; i < 3; i++) {
        await request(limited.app).post('/api/auth/login').send(bad).expect(401);
      }
      const res = await request(limited.app).post('/api/auth/login').send(ADMIN).expect(429);
      expect(res.body.error.code).toBe('RATE_LIMITED');
    } finally {
      await limited.repositories.db.close();
    }
  });
});
