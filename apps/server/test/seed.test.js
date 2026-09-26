import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SEED_ADMIN, seedDatabase } from '../src/seed/seedDatabase.js';
import { createTestApp } from './helpers.js';

const NOW = new Date('2026-09-26T09:00:00Z'); // a Saturday (clinic open 09:00–13:00)

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {Awaited<ReturnType<typeof seedDatabase>>} */
let summary;
/** @type {import('supertest').Agent} */
let admin;

/** @param {import('express').Express} app */
const seed = (app, reset = false) =>
  seedDatabase({
    repositories: t.repositories,
    services: app.locals.services,
    storage: app.locals.storage,
    now: () => NOW,
    reset,
  });

beforeAll(async () => {
  t = await createTestApp({}, { now: () => NOW });
  summary = await seed(t.app);
  admin = request.agent(t.app);
  await admin
    .post('/api/auth/login')
    .send({ email: SEED_ADMIN.email, password: SEED_ADMIN.password })
    .expect(200);
}, 120_000);
afterAll(() => t.repositories.db.close());

describe('seedDatabase', () => {
  it('creates a realistic clinic', () => {
    expect(summary.patients).toBe(48);
    expect(summary.measurements).toBeGreaterThanOrEqual(48 * 3);
    expect(summary.measurements).toBeLessThanOrEqual(48 * 6);
    expect(summary.plans).toBeGreaterThan(25);
    expect(summary.prescriptions).toBeGreaterThan(5);
    expect(summary.foods).toBeGreaterThan(100);
    expect(summary.templates).toBe(4);
  });

  it('seeds Fatima exactly as in the mockup', async () => {
    const list = (await admin.get('/api/patients').query({ search: 'فاطمة بن عيسى' }).expect(200))
      .body.data;
    expect(list).toHaveLength(1);
    const fatima = list[0];
    expect(fatima).toMatchObject({ fileNumber: 'P-0001', gender: 'female', goal: 'weight_loss' });
    const measurements = (await admin.get(`/api/patients/${fatima.id}/measurements`).expect(200))
      .body.data;
    const newest = [...measurements].sort((/** @type {any} */ a, /** @type {any} */ b) =>
      b.date.localeCompare(a.date),
    )[0];
    expect(newest).toMatchObject({
      weightKg: 68,
      heightM: 1.65,
      waistCm: 82,
      hipCm: 98,
      bodyFatPct: 28,
    });
    const plans = (await admin.get(`/api/diet-plans?patientId=${fatima.id}`).expect(200)).body.data;
    expect(plans[0]).toMatchObject({
      dailyCalories: 1500,
      startDate: '2026-09-15',
      durationWeeks: 4,
      isActive: true,
    });
  });

  it('gives varied statuses, Algerian phones and a schedule for today', async () => {
    const all = await t.repositories.patients.findAll({});
    expect(new Set(all.map((p) => p.status)).size).toBeGreaterThanOrEqual(3);
    expect(all.every((p) => /^0[567]\d{8}$/.test(p.phone))).toBe(true);
    expect(new Set(all.map((p) => p.phone)).size).toBe(48);
    const today = (await admin.get('/api/appointments/today').expect(200)).body.data;
    expect(today.length).toBeGreaterThan(0);
    const stats = (await admin.get('/api/dashboard/stats').expect(200)).body;
    expect(stats.totalPatients).toBeGreaterThan(40);
  });

  it('refuses to seed over existing data unless reset is requested', async () => {
    await expect(seed(t.app)).rejects.toThrow(/--force/);
  });

  it('is deterministic and can reset', async () => {
    const names = (await t.repositories.patients.findAll({}))
      .map((p) => `${p.fileNumber} ${p.fullName} ${p.phone}`)
      .sort();
    const again = await seed(t.app, true);
    expect(again).toEqual(summary);
    const after = (await t.repositories.patients.findAll({}))
      .map((p) => `${p.fileNumber} ${p.fullName} ${p.phone}`)
      .sort();
    expect(after).toEqual(names);
  }, 120_000);
});
