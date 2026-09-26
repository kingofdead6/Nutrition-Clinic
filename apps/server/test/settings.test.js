import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalFileStorage } from '../src/storage/LocalFileStorage.js';
import { createTestApp, setupAdmin, TINY_PNG } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
});
afterEach(() => t.repositories.db.close());

describe('/api/settings', () => {
  it('returns full settings with defaults plus the setup values', async () => {
    const res = await admin.get('/api/settings').expect(200);
    expect(res.body).toMatchObject({
      clinicName: 'عيادة الاختبار',
      practitionerName: 'د. سارة',
      tagline: 'صحتك ... توازن حياتك',
      practitionerTitle: 'أخصائية التغذية',
      defaultAppointmentDurationMin: 30,
      timezone: 'Africa/Algiers',
      locale: 'ar',
      logoUrl: null,
    });
    expect(res.body.workingHours).toHaveLength(7);
  });

  it('PUT changes only the fields sent', async () => {
    const res = await admin.put('/api/settings').send({ phone: '0555000000' }).expect(200);
    expect(res.body).toMatchObject({
      phone: '0555000000',
      clinicName: 'عيادة الاختبار',
      practitionerName: 'د. سارة',
    });
  });

  it('validates the body', async () => {
    await admin.put('/api/settings').send({ defaultAppointmentDurationMin: 1 }).expect(400);
    await admin
      .put('/api/settings')
      .send({ workingHours: [{ day: 'sun', isOpen: true, open: '25:00', close: '16:00' }] })
      .expect(400);
    await admin
      .put('/api/settings')
      .send({ workingHours: [{ day: 'sun', isOpen: true, open: '16:00', close: '09:00' }] })
      .expect(400);
  });

  it('requires a session to read and admin to write', async () => {
    await request(t.app).get('/api/settings').expect(401);
    await admin
      .post('/api/users')
      .send({ name: 'N', email: 'n@clinic.local', password: 'nutri-1234', role: 'nutritionist' })
      .expect(201);
    const nutri = request.agent(t.app);
    await nutri
      .post('/api/auth/login')
      .send({ email: 'n@clinic.local', password: 'nutri-1234' })
      .expect(200);
    await nutri.get('/api/settings').expect(200);
    await nutri.put('/api/settings').send({ phone: '0555000000' }).expect(403);
  });
});

describe('/api/settings/logo', () => {
  it('uploads a PNG, serves it publicly with a versioned URL, and replaces/removes it', async () => {
    const res = await admin
      .post('/api/settings/logo')
      .attach('file', TINY_PNG, { filename: 'logo.png', contentType: 'image/png' })
      .expect(200);
    expect(res.body.logoUrl).toMatch(/^\/settings\/logo\?v=\d+$/);

    const img = await request(t.app).get('/api/settings/logo').expect(200);
    expect(img.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(img.body, TINY_PNG)).toBe(0);

    const status = await request(t.app).get('/api/auth/status');
    expect(status.body.clinic.logoUrl).toBe(res.body.logoUrl);

    // Replacing deletes the old file.
    await admin
      .post('/api/settings/logo')
      .attach('file', TINY_PNG, { filename: 'logo2.png', contentType: 'image/png' })
      .expect(200);
    const files = await new LocalFileStorage(t.config.paths.uploadsDir).list('logo');
    expect(files).toHaveLength(1);

    await admin.delete('/api/settings/logo').expect(200);
    await request(t.app).get('/api/settings/logo').expect(404);
  });

  it('rejects non-images, spoofed images and files over 2 MB', async () => {
    await admin
      .post('/api/settings/logo')
      .attach('file', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' })
      .expect(415);
    await admin
      .post('/api/settings/logo')
      .attach('file', Buffer.from('<svg onload="alert(1)"/>'), {
        filename: 'a.png',
        contentType: 'image/png',
      })
      .expect(415);
    const big = Buffer.concat([TINY_PNG, Buffer.alloc(2 * 1024 * 1024)]);
    const res = await admin
      .post('/api/settings/logo')
      .attach('file', big, { filename: 'big.png', contentType: 'image/png' })
      .expect(413);
    expect(res.body.error.message).toBe('errors.fileTooLarge');
    await admin.post('/api/settings/logo').expect(400);
  });
});
