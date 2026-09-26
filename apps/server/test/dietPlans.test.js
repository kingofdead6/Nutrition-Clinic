import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDays, todayIn } from '#shared';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;
/** @type {any} */
let fatima;
/** @type {Record<string, any>} */
let foods;
const today = () => todayIn('Africa/Algiers');

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
  fatima = (
    await admin.post('/api/patients').send({
      firstName: 'فاطمة',
      lastName: 'بن عيسى',
      gender: 'female',
      birthDate: '1994-03-10',
      phone: '0555123456',
      goal: 'weight_loss',
    })
  ).body;
  const all = (await admin.get('/api/foods?pageSize=500')).body.data;
  foods = Object.fromEntries(all.map((/** @type {any} */ f) => [f.name, f]));
});
afterEach(() => t.repositories.db.close());

/** @param {Record<string, unknown>} [over] */
const planInput = (over = {}) => ({
  patientId: fatima.id,
  title: 'خطة إنقاص الوزن',
  goal: 'weight_loss',
  dailyCalories: 1500,
  macroTargets: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
  startDate: '2026-09-15',
  durationWeeks: 4,
  days: [
    {
      day: 'daily',
      meals: [
        {
          mealType: 'breakfast',
          time: '08:00',
          items: [
            { foodId: foods['شوفان'].id, quantity: 40, unit: 'g' },
            { foodId: foods['تمر (دقلة نور)'].id, quantity: 3, unit: 'g' }, // unit is corrected to the food's
          ],
        },
        {
          mealType: 'lunch',
          items: [{ foodId: foods['كسكس مطبوخ'].id, quantity: 150, unit: 'g' }],
        },
      ],
    },
  ],
  ...over,
});

describe('creating plans', () => {
  it('snapshots food name, unit and nutrition and derives the end date', async () => {
    const res = await admin
      .post('/api/diet-plans')
      .send(planInput({ activate: false }))
      .expect(201);
    expect(res.body).toMatchObject({
      endDate: '2026-10-12',
      isActive: false,
      isTemplate: false,
      patient: { fullName: 'فاطمة بن عيسى' },
    });
    const [oats, dates] = res.body.days[0].meals[0].items;
    expect(oats).toMatchObject({ foodName: 'شوفان', quantity: 40, unit: 'g', calories: 152 });
    expect(dates).toMatchObject({ foodName: 'تمر (دقلة نور)', unit: 'piece', calories: 69 });
    expect(res.body.days[0].meals[1].items[0]).toMatchObject({ calories: 168, carbsG: 34.8 });
  });

  it('editing or deleting a food never changes an existing plan', async () => {
    const plan = (await admin.post('/api/diet-plans').send(planInput())).body;
    await admin.put(`/api/foods/${foods['شوفان'].id}`).send({ calories: 999 }).expect(200);
    await admin.delete(`/api/foods/${foods['كسكس مطبوخ'].id}`).expect(204);
    const again = (await admin.get(`/api/diet-plans/${plan.id}`)).body;
    expect(again.days[0].meals[0].items[0].calories).toBe(152);
    expect(again.days[0].meals[1].items[0].foodName).toBe('كسكس مطبوخ');
  });

  it('validates macros, unknown foods and the patient', async () => {
    await admin
      .post('/api/diet-plans')
      .send(planInput({ macroTargets: { proteinPct: 30, carbsPct: 30, fatPct: 30 } }))
      .expect(400);
    const unknown = await admin
      .post('/api/diet-plans')
      .send(
        planInput({
          days: [
            {
              day: 'daily',
              meals: [
                {
                  mealType: 'lunch',
                  items: [
                    { foodId: '00000000-0000-4000-8000-000000000000', quantity: 1, unit: 'g' },
                  ],
                },
              ],
            },
          ],
        }),
      )
      .expect(400);
    expect(unknown.body.error.details[0]).toMatchObject({
      path: 'days.0.meals.0.items.0.foodId',
      message: 'errors.foodNotFound',
    });
    await admin
      .post('/api/diet-plans')
      .send(planInput({ patientId: null }))
      .expect(400);
  });
});

describe('active plan and patient status', () => {
  it('activating a new plan deactivates the previous one; status follows the active plan', async () => {
    const start = addDays(today(), -2);
    const first = (
      await admin.post('/api/diet-plans').send(planInput({ startDate: addDays(today(), -40) }))
    ).body;
    expect(first.isActive).toBe(true);
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.status).toBe('plan_ended'); // 4 weeks from 40 days ago

    const second = (await admin.post('/api/diet-plans').send(planInput({ startDate: start }))).body;
    expect(second.isActive).toBe(true);
    expect((await admin.get(`/api/diet-plans/${first.id}`)).body.isActive).toBe(false);
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.status).toBe('new_plan');

    const list = (await admin.get(`/api/patients/${fatima.id}/diet-plans`)).body.data;
    expect(list.filter((/** @type {any} */ p) => p.isActive)).toHaveLength(1);

    await admin.post(`/api/diet-plans/${first.id}/activate`).expect(200);
    expect((await admin.get(`/api/diet-plans/${second.id}`)).body.isActive).toBe(false);

    await admin.post(`/api/diet-plans/${first.id}/deactivate`).expect(200);
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.status).toBe('follow_up');
  });

  it('changing the start date re-derives the end date and the status', async () => {
    const plan = (
      await admin.post('/api/diet-plans').send(planInput({ startDate: addDays(today(), -60) }))
    ).body;
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.status).toBe('plan_ended');
    const res = await admin
      .put(`/api/diet-plans/${plan.id}`)
      .send({ startDate: today(), durationWeeks: 2 })
      .expect(200);
    expect(res.body.endDate).toBe(addDays(today(), 13));
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.status).toBe('new_plan');
  });

  it('deleting the active plan updates the status', async () => {
    const plan = (await admin.post('/api/diet-plans').send(planInput({ startDate: today() }))).body;
    await admin.delete(`/api/diet-plans/${plan.id}`).expect(204);
    expect((await admin.get(`/api/patients/${fatima.id}`)).body.status).toBe('follow_up');
  });
});

describe('templates and duplication', () => {
  it('saves a plan as a template, then applies it to another patient', async () => {
    const plan = (await admin.post('/api/diet-plans').send(planInput())).body;
    const template = (
      await admin
        .post(`/api/diet-plans/${plan.id}/duplicate`)
        .send({ isTemplate: true, title: 'قالب 1500' })
        .expect(201)
    ).body;
    expect(template).toMatchObject({
      isTemplate: true,
      patientId: null,
      isActive: false,
      title: 'قالب 1500',
    });
    expect(template.days).toEqual(plan.days);
    await admin.post(`/api/diet-plans/${template.id}/activate`).expect(409);

    const ahmed = (
      await admin.post('/api/patients').send({
        firstName: 'أحمد',
        lastName: 'سعيد',
        gender: 'male',
        birthDate: '1985-01-01',
        phone: '0661223344',
        goal: 'weight_loss',
      })
    ).body;
    const applied = (
      await admin
        .post(`/api/diet-plans/${template.id}/duplicate`)
        .send({ patientId: ahmed.id, startDate: today(), activate: true })
        .expect(201)
    ).body;
    expect(applied).toMatchObject({
      patientId: ahmed.id,
      isTemplate: false,
      isActive: true,
      endDate: addDays(today(), 27),
    });

    const templates = (await admin.get('/api/diet-plans?isTemplate=true')).body;
    expect(templates.total).toBe(1);
    expect((await admin.get('/api/diet-plans?isTemplate=false')).body.total).toBe(2);
  });

  it('creates a template directly (no patient)', async () => {
    const res = await admin
      .post('/api/diet-plans')
      .send(planInput({ patientId: null, isTemplate: true }))
      .expect(201);
    expect(res.body).toMatchObject({ patientId: null, isActive: false, patient: null });
  });

  it('deleting the patient deletes their plans but keeps templates', async () => {
    await admin.post('/api/diet-plans').send(planInput()).expect(201);
    await admin
      .post('/api/diet-plans')
      .send(planInput({ patientId: null, isTemplate: true }))
      .expect(201);
    await admin.delete(`/api/patients/${fatima.id}`).expect(204);
    expect((await admin.get('/api/diet-plans')).body.total).toBe(1);
  });
});
