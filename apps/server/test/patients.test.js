import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDays, todayIn } from '#shared';
import { createTestApp, setupAdmin, TINY_PNG } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;
const today = () => todayIn('Africa/Algiers');

/** @param {Record<string, unknown>} [over] */
const newPatient = (over = {}) => ({
  firstName: 'فاطمة',
  lastName: 'بن عيسى',
  gender: 'female',
  birthDate: '1994-03-10',
  phone: '0555 12 34 56',
  goal: 'weight_loss',
  ...over,
});

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
});
afterEach(() => t.repositories.db.close());

describe('POST /api/patients', () => {
  it('creates a patient with a sequential file number and derived fields', async () => {
    const a = await admin.post('/api/patients').send(newPatient()).expect(201);
    expect(a.body).toMatchObject({
      fileNumber: 'P-0001',
      fullName: 'فاطمة بن عيسى',
      phone: '0555123456', // normalized
      status: 'follow_up',
      archived: false,
      lastVisitDate: null,
      photoPath: null,
      activityLevel: 'sedentary', // default
      allergies: [],
    });
    const b = await admin
      .post('/api/patients')
      .send(newPatient({ firstName: 'أحمد' }))
      .expect(201);
    expect(b.body.fileNumber).toBe('P-0002');
  });

  it('ignores server-owned fields sent by the client', async () => {
    const res = await admin
      .post('/api/patients')
      .send(newPatient({ fileNumber: 'HACK', status: 'inactive', archived: true, id: 'x' }))
      .expect(201);
    expect(res.body).toMatchObject({ fileNumber: 'P-0001', status: 'follow_up', archived: false });
    expect(res.body.id).not.toBe('x');
  });

  it('validates phone, enums and birth date (not in the future)', async () => {
    const bad = await admin
      .post('/api/patients')
      .send(newPatient({ phone: '123', gender: 'x', firstName: '' }))
      .expect(400);
    const paths = bad.body.error.details.map((/** @type {{path:string}} */ d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['phone', 'gender', 'firstName']));

    const future = await admin
      .post('/api/patients')
      .send(newPatient({ birthDate: addDays(today(), 1) }))
      .expect(400);
    expect(future.body.error.details).toEqual([
      { path: 'birthDate', code: 'custom', message: 'validation.futureDate' },
    ]);
  });

  it('requires a session', async () => {
    await request(t.app).post('/api/patients').send(newPatient()).expect(401);
    await request(t.app).get('/api/patients').expect(401);
  });
});

describe('GET /api/patients', () => {
  beforeEach(async () => {
    const rows = [
      newPatient(),
      newPatient({
        firstName: 'أحمد',
        lastName: 'سعيد',
        gender: 'male',
        phone: '0661223344',
        goal: 'weight_gain',
      }),
      newPatient({ firstName: 'سارة', lastName: 'مدني', phone: '0770556677' }),
    ];
    for (const r of rows) await admin.post('/api/patients').send(r).expect(201);
  });

  it('paginates with { data, page, pageSize, total }', async () => {
    const res = await admin.get('/api/patients?pageSize=2&sort=fileNumber&dir=asc').expect(200);
    expect(res.body).toMatchObject({ page: 1, pageSize: 2, total: 3 });
    expect(res.body.data.map((/** @type {{fileNumber:string}} */ p) => p.fileNumber)).toEqual([
      'P-0001',
      'P-0002',
    ]);
  });

  it('searches name (Arabic-normalized), phone and file number', async () => {
    const names = async (/** @type {string} */ q) =>
      (await admin.get(`/api/patients?search=${encodeURIComponent(q)}`)).body.data.map(
        (/** @type {{fullName:string}} */ p) => p.fullName,
      );
    expect(await names('فاطمه')).toEqual(['فاطمة بن عيسى']);
    expect(await names('احمد')).toEqual(['أحمد سعيد']);
    expect(await names('0770')).toEqual(['سارة مدني']);
    expect(await names('P-0002')).toEqual(['أحمد سعيد']);
  });

  it('filters by gender, goal, status and archived', async () => {
    const count = async (/** @type {string} */ qs) =>
      (await admin.get(`/api/patients?${qs}`)).body.total;
    expect(await count('gender=male')).toBe(1);
    expect(await count('goal=weight_loss')).toBe(2);
    expect(await count('status=follow_up')).toBe(3);
    expect(await count('archived=true')).toBe(0);
    await admin.get('/api/patients?gender=other').expect(400);
  });
});

describe('patient updates', () => {
  /** @type {any} */
  let p;
  beforeEach(async () => {
    p = (await admin.post('/api/patients').send(newPatient())).body;
  });

  it('PUT changes only the fields sent and keeps fullName in sync', async () => {
    const res = await admin.put(`/api/patients/${p.id}`).send({ lastName: 'بوزيد' }).expect(200);
    expect(res.body).toMatchObject({
      fullName: 'فاطمة بوزيد',
      phone: '0555123456',
      goal: 'weight_loss',
      fileNumber: 'P-0001',
    });
  });

  it('a manual status override wins and can be cleared', async () => {
    const set = await admin
      .put(`/api/patients/${p.id}`)
      .send({ statusOverride: 'plan_ended' })
      .expect(200);
    expect(set.body.status).toBe('plan_ended');
    const cleared = await admin
      .put(`/api/patients/${p.id}`)
      .send({ statusOverride: null })
      .expect(200);
    expect(cleared.body.status).toBe('follow_up');
  });

  it('archiving hides the patient from the default list and makes it inactive', async () => {
    const res = await admin
      .patch(`/api/patients/${p.id}/archive`)
      .send({ archived: true })
      .expect(200);
    expect(res.body).toMatchObject({ archived: true, status: 'inactive' });
    expect((await admin.get('/api/patients')).body.total).toBe(0);
    expect((await admin.get('/api/patients?archived=true')).body.total).toBe(1);
    const back = await admin
      .patch(`/api/patients/${p.id}/archive`)
      .send({ archived: false })
      .expect(200);
    expect(back.body.status).toBe('follow_up');
  });

  it('404s on unknown ids and 400s on malformed ones', async () => {
    await admin.get('/api/patients/00000000-0000-4000-8000-000000000000').expect(404);
    await admin.get('/api/patients/nope').expect(400);
  });

  it('delete is admin only and cascades to measurements', async () => {
    await admin
      .post(`/api/patients/${p.id}/measurements`)
      .send({ date: today(), weightKg: 70, heightM: 1.65 })
      .expect(201);
    await admin
      .post('/api/users')
      .send({ name: 'N', email: 'n@clinic.local', password: 'nutri-1234', role: 'nutritionist' })
      .expect(201);
    const nutri = request.agent(t.app);
    await nutri
      .post('/api/auth/login')
      .send({ email: 'n@clinic.local', password: 'nutri-1234' })
      .expect(200);
    await nutri.delete(`/api/patients/${p.id}`).expect(403);

    await admin.delete(`/api/patients/${p.id}`).expect(204);
    await admin.get(`/api/patients/${p.id}`).expect(404);
    expect(await t.repositories.measurements.count()).toBe(0);
  });

  it('uploads, serves (signed-in only) and removes a photo', async () => {
    const up = await admin
      .post(`/api/patients/${p.id}/photo`)
      .attach('file', TINY_PNG, { filename: 'p.png', contentType: 'image/png' })
      .expect(200);
    expect(up.body.photoPath).toMatch(new RegExp(`^patients/${p.id}-[0-9a-f]{8}\\.png$`));
    const img = await admin.get(`/api/patients/${p.id}/photo`).expect(200);
    expect(img.headers['content-type']).toBe('image/png');
    await request(t.app).get(`/api/patients/${p.id}/photo`).expect(401);
    await admin.delete(`/api/patients/${p.id}/photo`).expect(200);
    await admin.get(`/api/patients/${p.id}/photo`).expect(404);
  });
});

describe('status from diet plans (computed, refreshed by the sweep)', () => {
  /** @param {string} patientId @param {string} startDate @param {string} endDate */
  const activePlan = (patientId, startDate, endDate) =>
    t.repositories.dietPlans.create({
      patientId,
      title: 'خطة',
      goal: 'weight_loss',
      dailyCalories: 1500,
      macroTargets: { proteinPct: 30, carbsPct: 45, fatPct: 25 },
      startDate,
      durationWeeks: 4,
      endDate,
      notes: '',
      isTemplate: false,
      isActive: true,
      days: [],
    });

  it('new_plan → plan_ended as dates pass', async () => {
    const p = (await admin.post('/api/patients').send(newPatient())).body;
    const services = t.app.locals.services;

    await activePlan(p.id, addDays(today(), -2), addDays(today(), 25));
    expect((await services.patients.refresh(p.id)).status).toBe('new_plan');

    await t.repositories.dietPlans.deleteByPatient(p.id);
    await activePlan(p.id, addDays(today(), -40), addDays(today(), -1));
    expect(await services.patients.refreshAllStatuses()).toBe(1);
    expect((await admin.get(`/api/patients/${p.id}`)).body.status).toBe('plan_ended');
    expect(await services.patients.refreshAllStatuses()).toBe(0); // idempotent
  });
});
