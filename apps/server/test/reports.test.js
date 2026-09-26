import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDays, monthStart, todayIn } from '@clinic/shared';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;
const today = () => todayIn('Africa/Algiers');

/** @param {Record<string, unknown>} over */
const newPatient = async (over) =>
  (
    await admin
      .post('/api/patients')
      .send({
        lastName: 'اختبار',
        gender: 'female',
        birthDate: '1990-01-01',
        phone: '0555000000',
        goal: 'weight_loss',
        ...over,
      })
      .expect(201)
  ).body;

/** @param {string} id @param {string} date @param {number} weightKg */
const visit = (id, date, weightKg) =>
  admin
    .post(`/api/patients/${id}/measurements`)
    .send({ date, weightKg, heightM: 1.65 })
    .expect(201);

/** @param {string} patientId @param {string} date @param {string} time @param {string} status */
const appt = (patientId, date, time, status) =>
  admin.post('/api/appointments').send({ patientId, date, time, status }).expect(201);

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
});
afterEach(() => t.repositories.db.close());

describe('GET /api/reports/overview', () => {
  it('defaults to the last 6 months and returns one row per month', async () => {
    const res = await admin.get('/api/reports/overview').expect(200);
    expect(res.body.from).toBe(monthStart(today(), 5));
    expect(res.body.to).toBe(today());
    expect(res.body.months).toHaveLength(6);
    expect(res.body.totals).toMatchObject({ newPatients: 0, visits: 0, attendanceRate: null });
  });

  it('counts visits as distinct patient-days (measurements + completed appointments)', async () => {
    const a = await newPatient({ firstName: 'أ' });
    const b = await newPatient({ firstName: 'ب' });
    const d1 = addDays(today(), -20);
    const d2 = addDays(today(), -10);
    await visit(a.id, d1, 80);
    await visit(a.id, d2, 78);
    await appt(a.id, d2, '09:00', 'completed'); // same day as a measurement → one visit
    await appt(b.id, d1, '10:00', 'completed');
    await appt(b.id, d2, '10:00', 'cancelled'); // not a visit

    const res = await admin
      .get(`/api/reports/overview?from=${addDays(today(), -30)}&to=${today()}`)
      .expect(200);
    expect(res.body.totals).toMatchObject({
      visits: 3,
      patientsSeen: 2,
      newPatients: 2,
      appointments: 3,
    });
    const total = res.body.months.reduce(
      (/** @type {number} */ s, /** @type {any} */ m) => s + m.visits,
      0,
    );
    expect(total).toBe(3);
  });

  it('attendance = completed / (completed + no-show) over past appointments; status breakdown', async () => {
    const a = await newPatient({ firstName: 'أ' });
    for (const [i, status] of [
      'completed',
      'completed',
      'completed',
      'no_show',
      'cancelled',
    ].entries()) {
      await appt(a.id, addDays(today(), -5), `0${i + 1}:00`, status);
    }
    await appt(a.id, addDays(today(), 3), '09:00', 'confirmed'); // future: not in attendance
    const res = await admin
      .get(`/api/reports/overview?from=${addDays(today(), -30)}&to=${addDays(today(), 30)}`)
      .expect(200);
    expect(res.body.totals.attendanceRate).toBe(75);
    expect(res.body.appointmentStatus).toEqual({
      pending: 0,
      confirmed: 1,
      completed: 3,
      cancelled: 1,
      no_show: 1,
    });
  });

  it('buckets weight change between the first and last visit in the range', async () => {
    const cases = [[80, 74], [70, 67.5], [60, 59.5], [55, 57], [90]];
    for (const [i, weights] of cases.entries()) {
      const p = await newPatient({
        firstName: `م${i}`,
        goal: i === 3 ? 'weight_gain' : 'weight_loss',
      });
      for (const [k, w] of weights.entries()) await visit(p.id, addDays(today(), -20 + k * 7), w);
    }
    const res = await admin
      .get(`/api/reports/overview?from=${addDays(today(), -30)}&to=${today()}`)
      .expect(200);
    expect(res.body.outcomes.buckets).toEqual({
      lost5: 1,
      lost3: 0,
      lost1: 1,
      stable: 1,
      gained1: 1,
      gained3: 0,
      gained5: 0,
    });
    expect(res.body.outcomes.patients).toBe(4);
    expect(res.body.outcomes.avgChangeKg).toBe(-1.8); // (-6 - 2.5 - 0.5 + 2) / 4 = -1.75
    const loss = res.body.outcomes.byGoal.find((/** @type {any} */ g) => g.goal === 'weight_loss');
    expect(loss).toEqual({ goal: 'weight_loss', patients: 3, avgChangeKg: -3 });
  });

  it('validates the range', async () => {
    await admin.get('/api/reports/overview?from=2026-09-10&to=2026-09-01').expect(400);
    await admin.get('/api/reports/overview?from=bad').expect(400);
    await request(t.app).get('/api/reports/overview').expect(401);
  });
});

describe('GET /api/reports/patient/:id', () => {
  it('summarises progress, goal progress, appointments, plans and prescriptions', async () => {
    const p = await newPatient({ firstName: 'فاطمة', targetWeightKg: 62 });
    await visit(p.id, addDays(today(), -42), 72);
    await visit(p.id, addDays(today(), -21), 70);
    await visit(p.id, today(), 68);
    await appt(p.id, addDays(today(), -21), '09:00', 'completed');
    await appt(p.id, addDays(today(), -14), '09:00', 'no_show');
    const tpl = (await admin.get('/api/prescription-templates')).body.data[0];
    await admin
      .post('/api/prescriptions')
      .send({ patientId: p.id, templateId: tpl.id })
      .expect(201);

    const res = await admin.get(`/api/reports/patient/${p.id}`).expect(200);
    expect(res.body.patient.fullName).toBe('فاطمة اختبار');
    expect(res.body.stats).toMatchObject({
      visits: 3,
      followedDays: 42,
      weightChangeKg: -4,
      goalProgressPct: 40,
      attendanceRate: 50,
      prescriptions: 1,
      appointments: { completed: 1, no_show: 1 },
    });
    expect(res.body.progress.series).toHaveLength(3);
    expect(res.body.generatedOn).toBe(today());
  });

  it('404s for an unknown patient', async () => {
    await admin.get('/api/reports/patient/00000000-0000-4000-8000-000000000000').expect(404);
  });
});
