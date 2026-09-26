import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDays, todayIn } from '#shared';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;
const today = () => todayIn('Africa/Algiers');

/** @param {string} firstName @param {string} goal @param {number[]} weights */
async function patientWithWeights(firstName, goal, weights) {
  const p = (
    await admin.post('/api/patients').send({
      firstName,
      lastName: 'اختبار',
      gender: 'female',
      birthDate: '1990-01-01',
      phone: '0555000000',
      goal,
    })
  ).body;
  for (const [i, weightKg] of weights.entries()) {
    await admin
      .post(`/api/patients/${p.id}/measurements`)
      .send({ date: addDays(today(), -30 + i * 7), weightKg, heightM: 1.65 })
      .expect(201);
  }
  return p;
}

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
});
afterEach(() => t.repositories.db.close());

describe('GET /api/dashboard/stats', () => {
  it('is all zeros / nulls on an empty clinic', async () => {
    const res = await admin.get('/api/dashboard/stats').expect(200);
    expect(res.body).toMatchObject({
      totalPatients: 0,
      todayAppointments: 0,
      avgWeightLossKg: null,
      avgWeightGainKg: null,
      newPatientsThisMonth: 0,
      patientsByStatus: { follow_up: 0, new_plan: 0, plan_ended: 0, inactive: 0 },
      today: today(),
    });
  });

  it('averages first − latest over weight-loss patients with ≥2 visits, positive losses only', async () => {
    await patientWithWeights('أ', 'weight_loss', [80, 78, 76]); // lost 4
    await patientWithWeights('ب', 'weight_loss', [70, 68]); // lost 2
    await patientWithWeights('ج', 'weight_loss', [60, 61]); // gained → excluded
    await patientWithWeights('د', 'weight_loss', [90]); // one visit → excluded
    await patientWithWeights('ه', 'weight_gain', [50, 51.5]); // gained 1.5
    await patientWithWeights('و', 'weight_gain', [55, 54]); // lost → excluded
    await patientWithWeights('ز', 'maintenance', [70, 60]); // other goal → ignored

    const res = await admin.get('/api/dashboard/stats').expect(200);
    expect(res.body).toMatchObject({
      totalPatients: 7,
      avgWeightLossKg: 3,
      weightLossPatients: 2,
      avgWeightGainKg: 1.5,
      weightGainPatients: 1,
      newPatientsThisMonth: 7,
    });
    expect(res.body.patientsByStatus.follow_up).toBe(7);
  });

  it("counts today's appointments except cancelled, and ignores archived patients", async () => {
    const p = await patientWithWeights('ح', 'weight_loss', []);
    const archived = await patientWithWeights('ط', 'weight_loss', []);
    await admin.patch(`/api/patients/${archived.id}/archive`).send({ archived: true }).expect(200);
    for (const [time, status] of [
      ['00:00', 'confirmed'],
      ['00:30', 'pending'],
      ['01:00', 'cancelled'],
    ]) {
      await admin
        .post('/api/appointments')
        .send({ patientId: p.id, date: today(), time, status })
        .expect(201);
    }
    await admin
      .post('/api/appointments')
      .send({ patientId: p.id, date: addDays(today(), 1), time: '09:00' })
      .expect(201);

    const res = await admin.get('/api/dashboard/stats').expect(200);
    expect(res.body.todayAppointments).toBe(2);
    expect(res.body.totalPatients).toBe(1);
  });

  it('requires a session', async () => {
    await request(t.app).get('/api/dashboard/stats').expect(401);
  });
});
