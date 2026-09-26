import { describe, expect, it } from 'vitest';
import type { Measurement } from '../schemas/measurement';
import { addDays, ageOn, daysBetween } from './dateOnly';
import { bmiCategory, computeBmi, computeWaistHipRatio, deriveMeasurement } from './health';
import { buildProgress } from './progress';
import { computePatientStatus, type StatusInput } from './status';

describe('BMI', () => {
  it('computes weight / height² rounded to 1 decimal', () => {
    expect(computeBmi(68, 1.65)).toBe(25); // 24.977…
    expect(computeBmi(70, 1.75)).toBe(22.9);
    expect(computeBmi(95.5, 1.8)).toBe(29.5);
  });

  it('rejects non-positive inputs', () => {
    expect(() => computeBmi(0, 1.7)).toThrow(RangeError);
    expect(() => computeBmi(70, 0)).toThrow(RangeError);
  });

  it.each([
    [18.4, 'underweight'],
    [18.5, 'normal'],
    [24.9, 'normal'],
    [25, 'overweight'],
    [29.9, 'overweight'],
    [30, 'obese_1'],
    [35, 'obese_2'],
    [39.9, 'obese_2'],
    [40, 'obese_3'],
  ] as const)('classifies %s as %s (WHO)', (bmi, category) => {
    expect(bmiCategory(bmi)).toBe(category);
  });
});

describe('roundTo', () => {
  it('rounds halves away from zero, symmetrically for losses and gains', async () => {
    const { roundTo } = await import('./health');
    expect(roundTo(1.75, 1)).toBe(1.8);
    expect(roundTo(-1.75, 1)).toBe(-1.8);
    expect(roundTo(-4.44, 1)).toBe(-4.4);
    expect(roundTo(0.845, 2)).toBe(0.85);
  });
});

describe('waist-to-hip ratio', () => {
  it('rounds to 2 decimals', () => {
    expect(computeWaistHipRatio(82, 98)).toBe(0.84);
    expect(computeWaistHipRatio(100, 100)).toBe(1);
  });
  it('is null when a value is missing', () => {
    expect(computeWaistHipRatio(null, 98)).toBeNull();
    expect(computeWaistHipRatio(82, undefined)).toBeNull();
  });
});

describe('deriveMeasurement', () => {
  it('returns all derived fields (the mockup patient: 68 kg, 1.65 m, 82/98)', () => {
    expect(deriveMeasurement({ weightKg: 68, heightM: 1.65, waistCm: 82, hipCm: 98 })).toEqual({
      bmi: 25,
      bmiCategory: 'overweight',
      waistHipRatio: 0.84,
    });
  });
});

describe('date-only helpers', () => {
  it('counts days across month/leap boundaries without timezone drift', () => {
    expect(daysBetween('2026-09-15', '2026-09-22')).toBe(7);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2026-09-25', '2026-09-20')).toBe(-5);
    expect(addDays('2026-09-15', 27)).toBe('2026-10-12');
  });

  it('computes age in completed years', () => {
    expect(ageOn('1994-03-10', '2026-09-25')).toBe(32);
    expect(ageOn('1994-09-25', '2026-09-25')).toBe(32); // birthday today
    expect(ageOn('1994-09-26', '2026-09-25')).toBe(31); // tomorrow
    expect(ageOn('2000-02-29', '2027-02-28')).toBe(26);
  });
});

describe('computePatientStatus', () => {
  const base: StatusInput = {
    archived: false,
    statusOverride: null,
    activePlan: null,
    lastVisitDate: '2026-09-20',
    createdDate: '2026-08-01',
    today: '2026-09-25',
  };
  const plan = (startDate: string, endDate: string) => ({
    ...base,
    activePlan: { startDate, endDate },
  });

  it('new_plan when the active plan started within the last 7 days (or starts later)', () => {
    expect(computePatientStatus(plan('2026-09-25', '2026-10-22'))).toBe('new_plan');
    expect(computePatientStatus(plan('2026-09-19', '2026-10-16'))).toBe('new_plan'); // 6 days ago
    expect(computePatientStatus(plan('2026-10-01', '2026-10-28'))).toBe('new_plan');
  });

  it('follow_up once the plan is 7+ days old and still running', () => {
    expect(computePatientStatus(plan('2026-09-18', '2026-10-15'))).toBe('follow_up'); // 7 days
    expect(computePatientStatus(plan('2026-09-15', '2026-10-12'))).toBe('follow_up'); // the mockup's Fatima
  });

  it('plan_ended when the active plan end date has passed (last day still counts)', () => {
    expect(computePatientStatus(plan('2026-08-01', '2026-09-24'))).toBe('plan_ended');
    expect(computePatientStatus(plan('2026-08-01', '2026-09-25'))).toBe('follow_up');
  });

  it('without a plan: follow_up if seen within 60 days, inactive after', () => {
    expect(computePatientStatus(base)).toBe('follow_up');
    expect(computePatientStatus({ ...base, lastVisitDate: '2026-07-27' })).toBe('follow_up'); // 60 days
    expect(computePatientStatus({ ...base, lastVisitDate: '2026-07-26' })).toBe('inactive'); // 61 days
  });

  it('a newly registered patient with no visit yet is follow_up, not inactive', () => {
    expect(computePatientStatus({ ...base, lastVisitDate: null, createdDate: '2026-09-25' })).toBe(
      'follow_up',
    );
    expect(computePatientStatus({ ...base, lastVisitDate: null, createdDate: '2026-05-01' })).toBe(
      'inactive',
    );
  });

  it('archived patients are inactive; a manual override always wins', () => {
    expect(computePatientStatus({ ...plan('2026-09-24', '2026-10-21'), archived: true })).toBe(
      'inactive',
    );
    expect(computePatientStatus({ ...base, archived: true, statusOverride: 'follow_up' })).toBe(
      'follow_up',
    );
    expect(computePatientStatus({ ...base, statusOverride: 'plan_ended' })).toBe('plan_ended');
  });
});

describe('buildProgress', () => {
  const m = (date: string, weightKg: number, extra: Partial<Measurement> = {}): Measurement => ({
    id: date,
    patientId: 'p',
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
    date,
    weightKg,
    heightM: 1.65,
    waistCm: null,
    hipCm: null,
    bodyFatPct: null,
    muscleMassKg: null,
    visceralFat: null,
    waterPct: null,
    notes: '',
    ...deriveMeasurement({ weightKg, heightM: 1.65 }),
    ...extra,
  });

  it('orders visits and computes start, current and change', () => {
    const p = buildProgress([
      m('2026-09-15', 69.2, { waistCm: 84 }),
      m('2026-08-01', 72.5, { waistCm: 88, bodyFatPct: 31 }),
      m('2026-09-22', 68),
    ]);
    expect(p.series.map((s) => s.date)).toEqual(['2026-08-01', '2026-09-15', '2026-09-22']);
    expect(p.start?.weightKg).toBe(72.5);
    expect(p.current?.weightKg).toBe(68);
    expect(p.change.weightKg).toBe(-4.5);
    expect(p.change.waistCm).toBe(-4); // first and last visits where waist was recorded
    expect(p.change.bodyFatPct).toBeNull(); // only one reading
    expect(p.visits).toBe(3);
  });

  it('handles no visits', () => {
    const p = buildProgress([]);
    expect(p).toMatchObject({ series: [], start: null, current: null, visits: 0 });
    expect(p.change.weightKg).toBeNull();
  });
});
