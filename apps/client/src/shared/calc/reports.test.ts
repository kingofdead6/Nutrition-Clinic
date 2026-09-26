import { describe, expect, it } from 'vitest';
import {
  attendanceRate,
  goalProgressPct,
  monthsBetween,
  monthStart,
  outcomeBucket,
} from './reports';

describe('months', () => {
  it('lists months inclusively, across years', () => {
    expect(monthsBetween('2026-11-15', '2027-02-01')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
    expect(monthsBetween('2026-09-01', '2026-09-30')).toEqual(['2026-09']);
  });
  it('monthStart goes back whole months', () => {
    expect(monthStart('2026-09-26')).toBe('2026-09-01');
    expect(monthStart('2026-03-10', 5)).toBe('2025-10-01');
  });
});

describe('outcomeBucket', () => {
  it.each([
    [-7, 'lost5'],
    [-5, 'lost5'],
    [-4.9, 'lost3'],
    [-3, 'lost3'],
    [-1, 'lost1'],
    [-0.9, 'stable'],
    [0, 'stable'],
    [0.9, 'stable'],
    [1, 'gained1'],
    [3, 'gained3'],
    [5, 'gained5'],
  ] as const)('%s kg → %s', (kg, bucket) => {
    expect(outcomeBucket(kg)).toBe(bucket);
  });
});

describe('goalProgressPct', () => {
  it('weight loss: share of the way to the target', () => {
    expect(goalProgressPct({ goal: 'weight_loss', startKg: 72, currentKg: 68, targetKg: 62 })).toBe(
      40,
    );
    expect(goalProgressPct({ goal: 'weight_loss', startKg: 72, currentKg: 60, targetKg: 62 })).toBe(
      100,
    );
    expect(goalProgressPct({ goal: 'weight_loss', startKg: 72, currentKg: 74, targetKg: 62 })).toBe(
      0,
    );
  });
  it('weight gain works the other way', () => {
    expect(goalProgressPct({ goal: 'weight_gain', startKg: 50, currentKg: 52, targetKg: 58 })).toBe(
      25,
    );
  });
  it('is null without a usable target or for other goals', () => {
    expect(
      goalProgressPct({ goal: 'weight_loss', startKg: 72, currentKg: 68, targetKg: null }),
    ).toBeNull();
    expect(
      goalProgressPct({ goal: 'maintenance', startKg: 72, currentKg: 68, targetKg: 70 }),
    ).toBeNull();
    expect(
      goalProgressPct({ goal: 'weight_loss', startKg: 60, currentKg: 58, targetKg: 65 }),
    ).toBeNull();
  });
});

describe('attendanceRate', () => {
  it('completed / (completed + no-show)', () => {
    expect(attendanceRate(9, 1)).toBe(90);
    expect(attendanceRate(2, 1)).toBe(66.7);
    expect(attendanceRate(0, 0)).toBeNull();
  });
});
