import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDays, todayIn } from '@clinic/shared';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;
/** @type {{ id: string }} */
let patient;
const today = () => todayIn('Africa/Algiers');

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
  patient = (
    await admin.post('/api/patients').send({
      firstName: 'فاطمة',
      lastName: 'بن عيسى',
      gender: 'female',
      birthDate: '1994-03-10',
      phone: '0555123456',
      goal: 'weight_loss',
    })
  ).body;
});
afterEach(() => t.repositories.db.close());

const url = () => `/api/patients/${patient.id}/measurements`;

describe('measurements', () => {
  it('computes BMI, category and WHR on the server, ignoring client-sent values', async () => {
    const res = await admin
      .post(url())
      .send({
        date: '2026-09-15',
        weightKg: 68,
        heightM: 1.65,
        waistCm: 82,
        hipCm: 98,
        bodyFatPct: 28,
        bmi: 99,
        bmiCategory: 'obese_3',
      })
      .expect(201);
    expect(res.body).toMatchObject({
      patientId: patient.id,
      bmi: 25,
      bmiCategory: 'overweight',
      waistHipRatio: 0.84,
      muscleMassKg: null,
      notes: '',
    });
  });

  it('updates the patient last visit date to the latest visit', async () => {
    await admin.post(url()).send({ date: '2026-08-10', weightKg: 72, heightM: 1.65 }).expect(201);
    const latest = await admin
      .post(url())
      .send({ date: '2026-09-01', weightKg: 70, heightM: 1.65 })
      .expect(201);
    await admin.post(url()).send({ date: '2026-08-20', weightKg: 71, heightM: 1.65 }).expect(201);
    expect((await admin.get(`/api/patients/${patient.id}`)).body.lastVisitDate).toBe('2026-09-01');

    await admin.delete(`${url()}/${latest.body.id}`).expect(204);
    expect((await admin.get(`/api/patients/${patient.id}`)).body.lastVisitDate).toBe('2026-08-20');
  });

  it('lists visits oldest first', async () => {
    for (const date of ['2026-09-10', '2026-08-01', '2026-08-20']) {
      await admin.post(url()).send({ date, weightKg: 70, heightM: 1.65 }).expect(201);
    }
    const res = await admin.get(url()).expect(200);
    expect(res.body.data.map((/** @type {{date:string}} */ m) => m.date)).toEqual([
      '2026-08-01',
      '2026-08-20',
      '2026-09-10',
    ]);
  });

  it('update re-derives BMI from the merged record', async () => {
    const m = (await admin.post(url()).send({ date: '2026-09-01', weightKg: 70, heightM: 1.65 }))
      .body;
    const res = await admin.put(`${url()}/${m.id}`).send({ weightKg: 60 }).expect(200);
    expect(res.body).toMatchObject({ weightKg: 60, heightM: 1.65, bmi: 22, bmiCategory: 'normal' });
  });

  it('rejects future dates and implausible values', async () => {
    const future = await admin
      .post(url())
      .send({ date: addDays(today(), 1), weightKg: 70, heightM: 1.65 })
      .expect(400);
    expect(future.body.error.details[0]).toMatchObject({
      path: 'date',
      message: 'validation.futureDate',
    });
    await admin.post(url()).send({ date: today(), weightKg: 70, heightM: 165 }).expect(400); // cm, not m
    await admin.post(url()).send({ date: today(), weightKg: -1, heightM: 1.65 }).expect(400);
  });

  it("cannot touch another patient's measurement through this patient's URL", async () => {
    const other = (
      await admin.post('/api/patients').send({
        firstName: 'أحمد',
        lastName: 'سعيد',
        gender: 'male',
        birthDate: '1990-01-01',
        phone: '0661223344',
        goal: 'maintenance',
      })
    ).body;
    const m = (
      await admin
        .post(`/api/patients/${other.id}/measurements`)
        .send({ date: today(), weightKg: 80, heightM: 1.8 })
    ).body;
    await admin.put(`${url()}/${m.id}`).send({ weightKg: 50 }).expect(404);
    await admin.delete(`${url()}/${m.id}`).expect(404);
  });

  it('404s for an unknown patient', async () => {
    await admin.get('/api/patients/00000000-0000-4000-8000-000000000000/measurements').expect(404);
  });
});

describe('GET /api/patients/:id/progress', () => {
  it('returns the series plus start, current and change', async () => {
    const visits = [
      {
        date: '2026-08-01',
        weightKg: 72.5,
        heightM: 1.65,
        waistCm: 88,
        hipCm: 102,
        bodyFatPct: 31,
      },
      { date: '2026-08-25', weightKg: 70.1, heightM: 1.65, waistCm: 85, hipCm: 100 },
      { date: '2026-09-15', weightKg: 68, heightM: 1.65, waistCm: 82, hipCm: 98, bodyFatPct: 28 },
    ];
    for (const v of visits) await admin.post(url()).send(v).expect(201);
    const res = await admin.get(`/api/patients/${patient.id}/progress`).expect(200);
    expect(res.body.visits).toBe(3);
    expect(res.body.series).toHaveLength(3);
    expect(res.body.start).toMatchObject({ date: '2026-08-01', weightKg: 72.5 });
    expect(res.body.current).toMatchObject({ date: '2026-09-15', weightKg: 68, bmi: 25 });
    expect(res.body.change).toEqual({
      weightKg: -4.5,
      bmi: -1.6,
      waistCm: -6,
      hipCm: -4,
      bodyFatPct: -3,
    });
  });

  it('is empty for a patient without visits', async () => {
    const res = await admin.get(`/api/patients/${patient.id}/progress`).expect(200);
    expect(res.body).toMatchObject({ visits: 0, series: [], start: null, current: null });
  });
});
