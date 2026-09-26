import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { todayIn } from '#shared';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;
/** @type {any} */
let fatima;
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
      targetWeightKg: 62,
    })
  ).body;
  await admin
    .post(`/api/patients/${fatima.id}/measurements`)
    .send({ date: today(), weightKg: 68, heightM: 1.65 })
    .expect(201);
});
afterEach(() => t.repositories.db.close());

const templates = async () => (await admin.get('/api/prescription-templates')).body.data;

describe('prescription templates', () => {
  it('first-run setup installs the four Arabic templates', async () => {
    const list = await templates();
    expect(list.map((/** @type {any} */ x) => x.type).sort()).toEqual([
      'balanced',
      'diabetic',
      'weight_gain',
      'weight_loss',
    ]);
    expect(
      list.every(
        (/** @type {any} */ x) =>
          x.recommendations.length > 0 && x.bodyRichText.includes('{{patientName}}'),
      ),
    ).toBe(true);
    expect((await admin.post('/api/prescription-templates/defaults').expect(200)).body).toEqual({
      added: 0,
    });
  });

  it('sanitizes the body to the allowed tags and keeps placeholders', async () => {
    const res = await admin
      .post('/api/prescription-templates')
      .send({
        name: 'مخصص',
        type: 'custom',
        bodyRichText:
          '<p onclick="x()">مرحبا {{patientName}}</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:x">رابط</a><ul><li><strong>نقطة</strong></li></ul>',
      })
      .expect(201);
    expect(res.body.bodyRichText).toBe(
      '<p>مرحبا {{patientName}}</p>رابط<ul><li><strong>نقطة</strong></li></ul>',
    );
    const upd = await admin
      .put(`/api/prescription-templates/${res.body.id}`)
      .send({ bodyRichText: '<h3 style="color:red">عنوان</h3>' })
      .expect(200);
    expect(upd.body.bodyRichText).toBe('<h3>عنوان</h3>');
  });

  it('only admins and nutritionists write', async () => {
    await admin
      .post('/api/users')
      .send({ name: 'A', email: 'a@clinic.local', password: 'assist-123', role: 'assistant' })
      .expect(201);
    const asst = request.agent(t.app);
    await asst
      .post('/api/auth/login')
      .send({ email: 'a@clinic.local', password: 'assist-123' })
      .expect(200);
    await asst.get('/api/prescription-templates').expect(200);
    await asst.post('/api/prescription-templates').send({ name: 'x', type: 'custom' }).expect(403);
    await asst.post('/api/prescriptions').send({}).expect(403);
  });
});

describe('issuing prescriptions', () => {
  it('renders placeholders from the patient, latest visit, active plan and clinic', async () => {
    const tpl = (await templates()).find((/** @type {any} */ x) => x.type === 'weight_loss');
    const foods = (await admin.get('/api/foods?search=' + encodeURIComponent('شوفان'))).body.data;
    await admin
      .post('/api/diet-plans')
      .send({
        patientId: fatima.id,
        title: 'خطة الشهر',
        goal: 'weight_loss',
        dailyCalories: 1500,
        macroTargets: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
        startDate: today(),
        durationWeeks: 4,
        days: [
          {
            day: 'daily',
            meals: [
              { mealType: 'breakfast', items: [{ foodId: foods[0].id, quantity: 40, unit: 'g' }] },
            ],
          },
        ],
      })
      .expect(201);

    const res = await admin
      .post('/api/prescriptions')
      .send({ patientId: fatima.id, templateId: tpl.id })
      .expect(201);
    expect(res.body).toMatchObject({
      patientId: fatima.id,
      templateId: tpl.id,
      type: 'weight_loss',
      title: 'وصفة إنقاص الوزن',
      date: today(),
      patient: { fullName: 'فاطمة بن عيسى', fileNumber: 'P-0001' },
    });
    expect(res.body.dietPlanId).toBeTruthy();
    const html = res.body.renderedContent;
    for (const expected of ['فاطمة بن عيسى', '68', '25', '1500', '62', 'خطة الشهر'])
      expect(html).toContain(expected);
    expect(html).not.toContain('{{');
    expect(res.body.recommendations).toEqual(tpl.recommendations);
  });

  it('escapes patient data (no HTML injection through names) and dashes missing values', async () => {
    const evil = (
      await admin.post('/api/patients').send({
        firstName: '<img src=x onerror=alert(1)>',
        lastName: 'س',
        gender: 'male',
        birthDate: '1990-01-01',
        phone: '0661223344',
        goal: 'maintenance',
      })
    ).body;
    const tpl = (
      await admin.post('/api/prescription-templates').send({
        name: 't',
        type: 'custom',
        bodyRichText: '<p>{{patientName}} {{dailyCalories}} {{weightKg}}</p>',
      })
    ).body;
    const res = await admin
      .post('/api/prescriptions/preview')
      .send({ patientId: evil.id, templateId: tpl.id })
      .expect(200);
    expect(res.body.renderedContent).toBe('<p>&lt;img src=x onerror=alert(1)&gt; س — —</p>');
  });

  it('preview renders without saving', async () => {
    const tpl = (await templates())[0];
    const res = await admin
      .post('/api/prescriptions/preview')
      .send({ patientId: fatima.id, templateId: tpl.id })
      .expect(200);
    expect(res.body.renderedContent).toContain('فاطمة بن عيسى');
    expect((await admin.get('/api/prescriptions')).body.total).toBe(0);
  });

  it('is a snapshot: editing or deleting the template later does not change it', async () => {
    const tpl = (await templates())[0];
    const rx = (
      await admin.post('/api/prescriptions').send({ patientId: fatima.id, templateId: tpl.id })
    ).body;
    await admin
      .put(`/api/prescription-templates/${tpl.id}`)
      .send({ bodyRichText: '<p>نص جديد</p>', recommendations: [] })
      .expect(200);
    await admin.delete(`/api/prescription-templates/${tpl.id}`).expect(204);
    const again = (await admin.get(`/api/prescriptions/${rx.id}`)).body;
    expect(again.renderedContent).toBe(rx.renderedContent);
    expect(again.recommendations).toEqual(rx.recommendations);
  });

  it('can be edited (sanitized) and deleted; lists by patient newest first', async () => {
    const [a, b] = await templates();
    const first = (
      await admin
        .post('/api/prescriptions')
        .send({ patientId: fatima.id, templateId: a.id, date: '2026-09-01' })
    ).body;
    await admin
      .post('/api/prescriptions')
      .send({ patientId: fatima.id, templateId: b.id, date: '2026-09-20' })
      .expect(201);

    const list = (await admin.get(`/api/patients/${fatima.id}/prescriptions`)).body.data;
    expect(list.map((/** @type {any} */ x) => x.date)).toEqual(['2026-09-20', '2026-09-01']);

    const edited = await admin
      .put(`/api/prescriptions/${first.id}`)
      .send({ renderedContent: '<p>معدل</p><script>x</script>', foodsToAvoid: ['السكر'] })
      .expect(200);
    expect(edited.body).toMatchObject({ renderedContent: '<p>معدل</p>', foodsToAvoid: ['السكر'] });

    await admin.delete(`/api/prescriptions/${first.id}`).expect(204);
    expect((await admin.get('/api/prescriptions')).body.total).toBe(1);
  });

  it('validates the patient, template and that the plan belongs to the patient', async () => {
    const tpl = (await templates())[0];
    await admin
      .post('/api/prescriptions')
      .send({ patientId: '00000000-0000-4000-8000-000000000000', templateId: tpl.id })
      .expect(400);
    await admin
      .post('/api/prescriptions')
      .send({ patientId: fatima.id, templateId: '00000000-0000-4000-8000-000000000000' })
      .expect(404);
    const res = await admin
      .post('/api/prescriptions')
      .send({
        patientId: fatima.id,
        templateId: tpl.id,
        dietPlanId: '00000000-0000-4000-8000-000000000000',
      })
      .expect(400);
    expect(res.body.error.details[0].path).toBe('dietPlanId');
  });

  it('deleting the patient deletes their prescriptions', async () => {
    const tpl = (await templates())[0];
    await admin
      .post('/api/prescriptions')
      .send({ patientId: fatima.id, templateId: tpl.id })
      .expect(201);
    await admin.delete(`/api/patients/${fatima.id}`).expect(204);
    expect((await admin.get('/api/prescriptions')).body.total).toBe(0);
  });
});
