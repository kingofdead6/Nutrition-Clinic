import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BACKUP_COLLECTIONS } from '@clinic/shared';
import { DuplicateKeyError, REPOSITORY_CONTRACT } from '../../src/repositories/index.js';
import { patientFixture } from '../helpers.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * @param {string} patientId
 * @param {Partial<import('../../src/repositories/interfaces/common.js').NewEntity<import('@clinic/shared').DietPlan>>} [over]
 */
const planFixture = (patientId, over = {}) => ({
  patientId,
  title: 'خطة',
  goal: 'weight_loss',
  dailyCalories: 1500,
  macroTargets: { proteinPct: 30, carbsPct: 45, fatPct: 25 },
  startDate: '2026-09-15',
  durationWeeks: 4,
  endDate: '2026-10-12',
  notes: '',
  isTemplate: false,
  isActive: false,
  days: [{ day: 'daily', meals: [] }],
  ...over,
});

/** @param {string} patientId @param {string} date @param {string} time */
const apptFixture = (patientId, date, time) => ({
  patientId,
  date,
  time,
  durationMin: 30,
  type: 'follow_up',
  status: 'confirmed',
  notes: '',
});

/**
 * Behaviour every storage driver must have. Run it against each driver
 * (see mongo.contract.test.ts); a future SQLite driver reuses it unchanged.
 */
/**
 * @param {string} driver
 * @param {() => Promise<import('../../src/repositories/index.js').Repositories>} factory
 */
export function runRepositoryContract(driver, factory) {
  describe(`repository contract: ${driver}`, () => {
    /** @type {import('../../src/repositories/index.js').Repositories} */
    let repos;

    beforeEach(async () => {
      repos = await factory();
    });
    afterEach(async () => {
      await repos.db.close();
    });

    it('reports its driver and pings', async () => {
      expect(repos.db.driver).toBe(driver);
      expect(await repos.db.ping()).toBe(true);
    });

    it('implements every method of the repository contract', () => {
      for (const [name, methods] of Object.entries(REPOSITORY_CONTRACT)) {
        for (const method of methods) {
          expect(typeof repos[name][method], `${name}.${method}`).toBe('function');
        }
      }
    });

    describe('generic CRUD', () => {
      it('create assigns a UUID and timestamps and round-trips without storage fields', async () => {
        const created = await repos.patients.create(patientFixture());
        expect(created.id).toMatch(UUID);
        expect(created.createdAt).toBe(created.updatedAt);
        const found = await repos.patients.findById(created.id);
        expect(found).toEqual(created);
        expect(found).not.toHaveProperty('_id');
        expect(found).not.toHaveProperty('searchKey');
      });

      it('update merges, ignores undefined, keeps createdAt and bumps updatedAt', async () => {
        const created = await repos.patients.create(patientFixture());
        await new Promise((r) => setTimeout(r, 5));
        const updated = await repos.patients.update(created.id, {
          phone: '0661000000',
          email: undefined,
        });
        expect(updated).toMatchObject({
          phone: '0661000000',
          email: '',
          createdAt: created.createdAt,
        });
        expect(updated?.updatedAt > created.updatedAt).toBe(true);
        expect(await repos.patients.findById(created.id)).toEqual(updated);
      });

      it('update / findById / delete on a missing id', async () => {
        const missing = '00000000-0000-4000-8000-000000000000';
        expect(await repos.patients.findById(missing)).toBeNull();
        expect(await repos.patients.update(missing, { phone: '0555000000' })).toBeNull();
        expect(await repos.patients.delete(missing)).toBe(false);
      });

      it('findByIds, count and delete', async () => {
        const a = await repos.patients.create(patientFixture({ fileNumber: 'P-0001' }));
        const b = await repos.patients.create(patientFixture({ fileNumber: 'P-0002' }));
        expect((await repos.patients.findByIds([a.id, b.id])).map((p) => p.id).sort()).toEqual(
          [a.id, b.id].sort(),
        );
        expect(await repos.patients.findByIds([])).toEqual([]);
        expect(await repos.patients.count()).toBe(2);
        expect(await repos.patients.delete(a.id)).toBe(true);
        expect(await repos.patients.count()).toBe(1);
      });
    });

    describe('users', () => {
      const user = {
        name: 'Admin',
        email: 'admin@clinic.local',
        role: 'admin',
        isActive: true,
        passwordHash: 'x',
      };

      it('finds by email case-insensitively', async () => {
        const created = await repos.users.create(user);
        expect(await repos.users.findByEmail('ADMIN@clinic.local ')).toEqual(created);
      });

      it('rejects a duplicate email with DuplicateKeyError', async () => {
        await repos.users.create(user);
        await expect(repos.users.create(user)).rejects.toBeInstanceOf(DuplicateKeyError);
      });
    });

    describe('settings', () => {
      it('is a singleton: upsert creates once, then merges', async () => {
        expect(await repos.settings.get()).toBeNull();
        const first = await repos.settings.upsert({ clinicName: 'A', tagline: 't' });
        const second = await repos.settings.upsert({ clinicName: 'B' });
        expect(second.id).toBe(first.id);
        expect(second).toMatchObject({ clinicName: 'B', tagline: 't' });
        expect(await repos.settings.exportAll()).toHaveLength(1);
      });
    });

    describe('patients', () => {
      it('issues sequential file numbers', async () => {
        expect(await repos.patients.nextFileNumber()).toBe('P-0001');
        expect(await repos.patients.nextFileNumber()).toBe('P-0002');
      });

      it('searches normalized Arabic names, phone and file number', async () => {
        await repos.patients.create(patientFixture({ fileNumber: 'P-0001' }));
        await repos.patients.create(
          patientFixture({
            fileNumber: 'P-0002',
            firstName: 'أحمد',
            lastName: 'سعيد',
            phone: '0770112233',
          }),
        );
        const page = { page: 1, pageSize: 20 };
        const sort = { field: 'fileNumber', dir: 'asc' };
        /** @param {string} search */
        const names = async (search) =>
          (await repos.patients.list({ search }, page, sort)).items.map((p) => p.fileNumber);

        expect(await names('فاطمه')).toEqual(['P-0001']); // ة/ه
        expect(await names('احمد')).toEqual(['P-0002']); // أ/ا
        expect(await names('077 011')).toEqual(['P-0002']);
        expect(await names('p-0001')).toEqual(['P-0001']);
        expect(await names('zzz')).toEqual([]);
      });

      it('filters, sorts and paginates', async () => {
        for (let i = 1; i <= 5; i++) {
          await repos.patients.create(
            patientFixture({
              fileNumber: `P-000${i}`,
              gender: i % 2 ? 'female' : 'male',
              archived: i === 5,
              lastVisitDate: `2026-09-0${i}`,
            }),
          );
        }
        const res = await repos.patients.list(
          { archived: false },
          { page: 1, pageSize: 2 },
          { field: 'lastVisitDate', dir: 'desc' },
        );
        expect(res.total).toBe(4);
        expect(res.items.map((p) => p.fileNumber)).toEqual(['P-0004', 'P-0003']);
        const females = await repos.patients.findAll({ gender: 'female', archived: false });
        expect(females.map((p) => p.fileNumber)).toEqual(['P-0001', 'P-0003']);
      });

      it('counts by status and by creation window', async () => {
        await repos.patients.create(patientFixture({ fileNumber: 'P-0001', status: 'new_plan' }));
        await repos.patients.create(patientFixture({ fileNumber: 'P-0002', status: 'new_plan' }));
        await repos.patients.create(patientFixture({ fileNumber: 'P-0003', status: 'inactive' }));
        expect(await repos.patients.countByStatus()).toEqual({
          follow_up: 0,
          new_plan: 2,
          plan_ended: 0,
          inactive: 1,
        });
        expect(
          await repos.patients.countCreatedBetween(
            '2000-01-01T00:00:00.000Z',
            '2999-01-01T00:00:00.000Z',
          ),
        ).toBe(3);
        expect(
          await repos.patients.countCreatedBetween(
            '2000-01-01T00:00:00.000Z',
            '2000-02-01T00:00:00.000Z',
          ),
        ).toBe(0);
      });
    });

    describe('diet plans', () => {
      it('keeps at most one active plan per patient', async () => {
        const p = await repos.patients.create(patientFixture());
        const a = await repos.dietPlans.create(planFixture(p.id, { startDate: '2026-08-01' }));
        const b = await repos.dietPlans.create(planFixture(p.id, { startDate: '2026-09-15' }));
        await repos.dietPlans.activate(a.id);
        expect((await repos.dietPlans.findActiveByPatient(p.id))?.id).toBe(a.id);
        await repos.dietPlans.activate(b.id);
        expect((await repos.dietPlans.findActiveByPatient(p.id))?.id).toBe(b.id);
        expect((await repos.dietPlans.findById(a.id))?.isActive).toBe(false);
        expect((await repos.dietPlans.listByPatient(p.id)).map((x) => x.id)).toEqual([b.id, a.id]);
      });

      it('rejects a second active plan written directly', async () => {
        const p = await repos.patients.create(patientFixture());
        await repos.dietPlans.create(planFixture(p.id, { isActive: true }));
        await expect(
          repos.dietPlans.create(planFixture(p.id, { isActive: true })),
        ).rejects.toBeInstanceOf(DuplicateKeyError);
      });
    });

    describe('appointments', () => {
      it('lists by range in date/time order and finds upcoming', async () => {
        const p = await repos.patients.create(patientFixture());
        await repos.appointments.create(apptFixture(p.id, '2026-09-26', '09:00'));
        await repos.appointments.create(apptFixture(p.id, '2026-09-25', '14:00'));
        await repos.appointments.create(apptFixture(p.id, '2026-09-25', '08:00'));
        await repos.appointments.create({
          ...apptFixture(p.id, '2026-09-27', '10:00'),
          status: 'cancelled',
        });

        const range = await repos.appointments.findAll({ from: '2026-09-25', to: '2026-09-26' });
        expect(range.map((a) => `${a.date} ${a.time}`)).toEqual([
          '2026-09-25 08:00',
          '2026-09-25 14:00',
          '2026-09-26 09:00',
        ]);
        const upcoming = await repos.appointments.findUpcoming(
          { date: '2026-09-25', time: '10:00' },
          ['pending', 'confirmed'],
          5,
        );
        expect(upcoming.map((a) => `${a.date} ${a.time}`)).toEqual([
          '2026-09-25 14:00',
          '2026-09-26 09:00',
        ]);
      });
    });

    describe('foods', () => {
      it('bulk-creates and searches by normalized name', async () => {
        await repos.foods.createMany([
          {
            name: 'كسكس',
            nameFr: 'Couscous',
            category: 'traditional',
            servingSize: 100,
            servingUnit: 'g',
            calories: 112,
            proteinG: 3.8,
            carbsG: 23,
            fatG: 0.2,
            fiberG: 1.4,
            isCustom: false,
          },
          {
            name: 'تمر',
            nameFr: 'Dattes',
            category: 'fruits',
            servingSize: 1,
            servingUnit: 'piece',
            calories: 23,
            proteinG: 0.2,
            carbsG: 6,
            fatG: 0,
            fiberG: 0.6,
            isCustom: false,
          },
        ]);
        const res = await repos.foods.list({ search: 'couscous' }, { page: 1, pageSize: 10 });
        expect(res.items.map((f) => f.name)).toEqual(['كسكس']);
        expect(
          (await repos.foods.list({ category: 'fruits' }, { page: 1, pageSize: 10 })).total,
        ).toBe(1);
      });
    });

    describe('backup primitives', () => {
      it('export → import round-trips ids and timestamps and keeps the file counter ahead', async () => {
        await repos.patients.nextFileNumber();
        const p = await repos.patients.create(patientFixture({ fileNumber: 'P-0007' }));
        const m = await repos.measurements.create({
          patientId: p.id,
          date: '2026-09-01',
          weightKg: 70,
          heightM: 1.65,
          waistCm: 82,
          hipCm: 98,
          bodyFatPct: 28,
          muscleMassKg: null,
          visceralFat: null,
          waterPct: null,
          notes: '',
          bmi: 25.7,
          bmiCategory: 'overweight',
          waistHipRatio: 0.84,
        });
        const patients = await repos.patients.exportAll();
        const measurements = await repos.measurements.exportAll();

        await repos.patients.importAll([]);
        expect(await repos.patients.count()).toBe(0);

        await repos.patients.importAll(patients);
        await repos.measurements.importAll(measurements);
        expect(await repos.patients.findById(p.id)).toEqual(p);
        expect(await repos.measurements.listByPatient(p.id)).toEqual([m]);
        expect(await repos.patients.nextFileNumber()).toBe('P-0008');
      });

      it('every backup collection exports and re-imports unchanged (and importAll replaces)', async () => {
        await repos.settings.upsert({ clinicName: 'عيادة' });
        await repos.users.create({
          name: 'Admin',
          email: 'a@clinic.local',
          role: 'admin',
          isActive: true,
          passwordHash: 'hash',
          tokenVersion: 3,
        });
        await repos.patients.create(patientFixture());
        const food = await repos.foods.create({
          name: 'تمر',
          nameFr: 'Dattes',
          category: 'fruits',
          servingSize: 100,
          servingUnit: 'g',
          calories: 282,
          proteinG: 2.5,
          carbsG: 75,
          fatG: 0.4,
          fiberG: 8,
          isCustom: true,
        });

        for (const name of BACKUP_COLLECTIONS) {
          const before = await repos[name].exportAll();
          await repos[name].importAll(before);
          expect(await repos[name].exportAll(), name).toEqual(before);
        }
        const users = await repos.users.exportAll();
        expect(users[0]).toMatchObject({ passwordHash: 'hash', tokenVersion: 3 });

        await repos.foods.importAll([]);
        expect(await repos.foods.findById(food.id)).toBeNull();
      });
    });
  });
}
