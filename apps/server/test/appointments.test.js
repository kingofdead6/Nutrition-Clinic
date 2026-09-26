import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDays, todayIn } from '#shared';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;
/** @type {{ id: string, fullName: string }} */
let fatima;
/** @type {{ id: string }} */
let ahmed;
// Pinned clock: 12:00 in Algiers, so "upcoming" never depends on when the suite runs.
const NOW = new Date('2026-09-25T11:00:00Z');
const today = () => todayIn('Africa/Algiers', NOW);
const tomorrow = () => addDays(today(), 1);

/** @param {Record<string, unknown>} over */
const appt = (over) => ({
  patientId: fatima.id,
  date: tomorrow(),
  time: '09:00',
  durationMin: 30,
  ...over,
});

beforeEach(async () => {
  t = await createTestApp({}, { now: () => NOW });
  admin = await setupAdmin(t.app);
  const mk = (/** @type {Record<string, string>} */ o) =>
    admin
      .post('/api/patients')
      .send({ gender: 'female', birthDate: '1994-03-10', goal: 'weight_loss', ...o });
  fatima = (await mk({ firstName: 'فاطمة', lastName: 'بن عيسى', phone: '0555123456' })).body;
  ahmed = (await mk({ firstName: 'أحمد', lastName: 'سعيد', phone: '0661223344', gender: 'male' }))
    .body;
});
afterEach(() => t.repositories.db.close());

describe('creating appointments', () => {
  it('creates with defaults and returns the joined patient', async () => {
    const res = await admin
      .post('/api/appointments')
      .send({ patientId: fatima.id, date: tomorrow(), time: '10:30' })
      .expect(201);
    expect(res.body).toMatchObject({
      durationMin: 30,
      type: 'follow_up',
      status: 'pending',
      patient: {
        id: fatima.id,
        fullName: 'فاطمة بن عيسى',
        fileNumber: 'P-0001',
        phone: '0555123456',
      },
    });
  });

  it('rejects an unknown patient and malformed values', async () => {
    const unknown = await admin
      .post('/api/appointments')
      .send(appt({ patientId: '00000000-0000-4000-8000-000000000000' }))
      .expect(400);
    expect(unknown.body.error.details[0]).toMatchObject({ path: 'patientId' });
    await admin
      .post('/api/appointments')
      .send(appt({ time: '9:00' }))
      .expect(400);
    await admin
      .post('/api/appointments')
      .send(appt({ date: '2026/09/30' }))
      .expect(400);
    await admin
      .post('/api/appointments')
      .send(appt({ type: 'surgery' }))
      .expect(400);
  });

  it('requires a session', async () => {
    await request(t.app).get('/api/appointments').expect(401);
  });
});

describe('double-booking', () => {
  beforeEach(async () => {
    await admin
      .post('/api/appointments')
      .send(appt({ time: '09:00', durationMin: 30 }))
      .expect(201);
  });

  it('rejects an overlapping slot with the clashing appointment in details', async () => {
    const res = await admin
      .post('/api/appointments')
      .send(appt({ patientId: ahmed.id, time: '09:15' }))
      .expect(409);
    expect(res.body.error).toMatchObject({
      code: 'CONFLICT',
      message: 'errors.appointmentConflict',
      details: { time: '09:00', durationMin: 30, patientName: 'فاطمة بن عيسى' },
    });
  });

  it('allows back-to-back slots and other days', async () => {
    await admin
      .post('/api/appointments')
      .send(appt({ patientId: ahmed.id, time: '09:30' }))
      .expect(201);
    await admin
      .post('/api/appointments')
      .send(appt({ time: '08:30' }))
      .expect(201);
    await admin
      .post('/api/appointments')
      .send(appt({ date: addDays(today(), 2) }))
      .expect(201);
  });

  it('a cancelled appointment frees its slot; re-confirming it then conflicts', async () => {
    const list = (await admin.get(`/api/appointments?from=${tomorrow()}&to=${tomorrow()}`)).body
      .data;
    await admin
      .patch(`/api/appointments/${list[0].id}/status`)
      .send({ status: 'cancelled' })
      .expect(200);
    await admin
      .post('/api/appointments')
      .send(appt({ patientId: ahmed.id, time: '09:00' }))
      .expect(201);
    await admin
      .patch(`/api/appointments/${list[0].id}/status`)
      .send({ status: 'confirmed' })
      .expect(409);
  });

  it('moving an appointment checks the new slot but ignores itself', async () => {
    const other = (
      await admin.post('/api/appointments').send(appt({ patientId: ahmed.id, time: '11:00' }))
    ).body;
    await admin.put(`/api/appointments/${other.id}`).send({ time: '11:10' }).expect(200); // overlaps only itself
    await admin.put(`/api/appointments/${other.id}`).send({ time: '09:20' }).expect(409);
    await admin.put(`/api/appointments/${other.id}`).send({ notes: 'ok' }).expect(200); // no slot change
  });
});

describe('listing', () => {
  beforeEach(async () => {
    const rows = [
      appt({ date: addDays(today(), -3), time: '10:00', status: 'completed' }),
      appt({ date: today(), time: '08:00', status: 'confirmed' }), // earlier today → not upcoming
      appt({ date: today(), time: '15:30', patientId: ahmed.id }),
      appt({ date: tomorrow(), time: '09:00', status: 'confirmed' }),
      appt({ date: tomorrow(), time: '10:00', patientId: ahmed.id, status: 'cancelled' }),
      appt({ date: addDays(today(), 5), time: '08:00' }),
    ];
    for (const r of rows) await admin.post('/api/appointments').send(r).expect(201);
  });

  it('filters by date range, status and patient, ordered by date then time', async () => {
    const range = (await admin.get(`/api/appointments?from=${today()}&to=${tomorrow()}`)).body;
    expect(range.total).toBe(4);
    expect(range.data.map((/** @type {any} */ a) => `${a.date} ${a.time}`)).toEqual([
      `${today()} 08:00`,
      `${today()} 15:30`,
      `${tomorrow()} 09:00`,
      `${tomorrow()} 10:00`,
    ]);
    expect((await admin.get('/api/appointments?status=cancelled')).body.total).toBe(1);
    expect((await admin.get(`/api/appointments?patientId=${ahmed.id}`)).body.total).toBe(2);
  });

  it("today returns every appointment of the clinic's day", async () => {
    const res = await admin.get('/api/appointments/today').expect(200);
    expect(res.body.data.map((/** @type {any} */ a) => a.time)).toEqual(['08:00', '15:30']);
  });

  it('upcoming skips past, cancelled and completed ones, and honours limit', async () => {
    const res = await admin.get('/api/appointments/upcoming?limit=5').expect(200);
    expect(res.body.data.map((/** @type {any} */ a) => `${a.date} ${a.time}`)).toEqual([
      `${today()} 15:30`,
      `${tomorrow()} 09:00`,
      `${addDays(today(), 5)} 08:00`,
    ]);
    expect(res.body.data[0].patient.fullName).toBe('أحمد سعيد');
    expect((await admin.get('/api/appointments/upcoming?limit=1')).body.data).toHaveLength(1);
    await admin.get('/api/appointments/upcoming?limit=0').expect(400);
  });
});

describe('status changes and visits', () => {
  it('completing an appointment updates the patient last visit; reverting restores it', async () => {
    const a = (await admin.post('/api/appointments').send(appt({ date: today(), time: '00:00' })))
      .body;
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.lastVisitDate).toBeNull();
    await admin.patch(`/api/appointments/${a.id}/status`).send({ status: 'completed' }).expect(200);
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.lastVisitDate).toBe(today());
    await admin.patch(`/api/appointments/${a.id}/status`).send({ status: 'no_show' }).expect(200);
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.lastVisitDate).toBeNull();
  });

  it('validates the status and 404s on unknown ids', async () => {
    const a = (await admin.post('/api/appointments').send(appt({}))).body;
    await admin.patch(`/api/appointments/${a.id}/status`).send({ status: 'done' }).expect(400);
    await admin.get('/api/appointments/00000000-0000-4000-8000-000000000000').expect(404);
    await admin.delete(`/api/appointments/${a.id}`).expect(204);
    await admin.get(`/api/appointments/${a.id}`).expect(404);
  });

  it('deleting a patient removes their appointments', async () => {
    await admin.post('/api/appointments').send(appt({})).expect(201);
    await admin.delete(`/api/patients/${fatima.id}`).expect(204);
    expect((await admin.get('/api/appointments')).body.total).toBe(0);
  });
});
