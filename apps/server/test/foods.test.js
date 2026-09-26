import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseCsv } from '../src/lib/csv.js';
import { defaultFoods } from '../src/data/defaultFoods.js';
import { createTestApp, setupAdmin } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
});
afterEach(() => t.repositories.db.close());

const food = {
  name: 'كسكس بالحليب (مسفوف)',
  nameFr: 'Mesfouf',
  category: 'traditional',
  servingSize: 200,
  servingUnit: 'g',
  calories: 330,
  proteinG: 10,
  carbsG: 55,
  fatG: 7,
};

describe('starter foods', () => {
  it('first-run setup installs the default food database', async () => {
    const res = await admin.get('/api/foods?pageSize=500').expect(200);
    expect(res.body.total).toBe(defaultFoods().length);
    expect(res.body.total).toBeGreaterThanOrEqual(80);
    expect(res.body.data.every((/** @type {any} */ f) => f.isCustom === false)).toBe(true);
  });

  it('install-defaults only adds missing ones', async () => {
    expect((await admin.post('/api/foods/defaults').expect(200)).body).toEqual({ added: 0 });
    const any = (await admin.get('/api/foods?search=' + encodeURIComponent('تمر'))).body.data[0];
    await admin.delete(`/api/foods/${any.id}`).expect(204);
    expect((await admin.post('/api/foods/defaults').expect(200)).body).toEqual({ added: 1 });
  });

  it('every default food is valid and categories cover the spec', () => {
    const categories = new Set(defaultFoods().map((f) => f.category));
    expect([...categories].sort()).toEqual([
      'dairy',
      'drinks',
      'fats',
      'fruits',
      'grains',
      'proteins',
      'sweets',
      'traditional',
      'vegetables',
    ]);
    const names = defaultFoods().map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
    for (const staple of [
      'كسكس مطبوخ',
      'شربة فريك',
      'كسرة (خبز الدار)',
      'مطلوع',
      'تمر (دقلة نور)',
      'لبن',
      'رشتة',
      'لوبيا',
    ]) {
      expect(names).toContain(staple);
    }
  });
});

describe('/api/foods CRUD, search and roles', () => {
  it('creates a custom food and finds it by Arabic, French or category', async () => {
    const created = await admin.post('/api/foods').send(food).expect(201);
    expect(created.body).toMatchObject({ isCustom: true, fiberG: 0 });
    const byAr = await admin.get('/api/foods?search=' + encodeURIComponent('مسفوف'));
    expect(byAr.body.data.map((/** @type {any} */ f) => f.id)).toContain(created.body.id);
    const byFr = await admin.get('/api/foods?search=mesfouf');
    expect(byFr.body.total).toBe(1);
    const byCategory = await admin.get('/api/foods?category=traditional&pageSize=500');
    expect(byCategory.body.data.every((/** @type {any} */ f) => f.category === 'traditional')).toBe(
      true,
    );
  });

  it('validates and updates', async () => {
    await admin
      .post('/api/foods')
      .send({ ...food, servingUnit: 'kg' })
      .expect(400);
    await admin
      .post('/api/foods')
      .send({ ...food, calories: -5 })
      .expect(400);
    const created = (await admin.post('/api/foods').send(food)).body;
    const updated = await admin.put(`/api/foods/${created.id}`).send({ calories: 300 }).expect(200);
    expect(updated.body).toMatchObject({ calories: 300, name: food.name, servingSize: 200 });
  });

  it('assistants read but cannot write', async () => {
    await admin
      .post('/api/users')
      .send({ name: 'A', email: 'a@clinic.local', password: 'assist-123', role: 'assistant' })
      .expect(201);
    const asst = request.agent(t.app);
    await asst
      .post('/api/auth/login')
      .send({ email: 'a@clinic.local', password: 'assist-123' })
      .expect(200);
    await asst.get('/api/foods').expect(200);
    await asst.post('/api/foods').send(food).expect(403);
  });
});

describe('POST /api/foods/import (CSV)', () => {
  const csv = [
    'name;nameFr;category;servingSize;servingUnit;calories;proteinG;carbsG;fatG;fiberG',
    'مسفوف;Mesfouf;traditional;200;g;330;10;55;7;3',
    '"بريوش ""منزلي""";Brioche;sweets;50;g;180;4,5;25;7;1',
    'تمر (دقلة نور);Datte;fruits;1;piece;23;0.2;6;0;0.6',
    'سيئ;;unknown;1;g;1;0;0;0;0',
  ].join('\r\n');

  it('dry run reports what would happen without writing', async () => {
    const before = (await admin.get('/api/foods')).body.total;
    const res = await admin
      .post('/api/foods/import?dryRun=true')
      .attach('file', Buffer.from(String.fromCharCode(0xfeff) + csv, 'utf8'), {
        filename: 'foods.csv',
        contentType: 'text/csv',
      })
      .expect(200);
    expect(res.body).toMatchObject({ imported: 2, skipped: 1, dryRun: true });
    expect(res.body.errors).toEqual([
      expect.objectContaining({ line: 5, message: 'errors.csvRow' }),
    ]);
    expect((await admin.get('/api/foods')).body.total).toBe(before);
  });

  it('imports valid rows (quotes, ";" separator, decimal commas) and skips existing names', async () => {
    const res = await admin
      .post('/api/foods/import')
      .attach('file', Buffer.from(csv, 'utf8'), { filename: 'foods.csv', contentType: 'text/csv' })
      .expect(200);
    expect(res.body).toMatchObject({ imported: 2, skipped: 1 });
    const brioche = (await admin.get('/api/foods?search=brioche')).body.data[0];
    expect(brioche).toMatchObject({ name: 'بريوش "منزلي"', proteinG: 4.5, isCustom: true });
  });

  it('rejects a file missing required columns or not a CSV', async () => {
    const bad = await admin
      .post('/api/foods/import')
      .attach('file', Buffer.from('foo,bar\n1,2'), { filename: 'x.csv', contentType: 'text/csv' })
      .expect(400);
    expect(bad.body.error.message).toBe('errors.csvColumns');
    await admin
      .post('/api/foods/import')
      .attach('file', Buffer.from('x'), { filename: 'x.png', contentType: 'image/png' })
      .expect(415);
  });
});

describe('parseCsv', () => {
  it('handles commas, quotes, embedded newlines and blank lines', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\n\n"multi\nline",2\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['multi\nline', '2'],
    ]);
  });
});
