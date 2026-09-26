import { describe, expect, it } from 'vitest';
import {
  dayTotals,
  macroGrams,
  mealTotals,
  planEndDate,
  planItemFromFood,
  scalePlanItem,
  suggestCalories,
} from './nutrition';

const couscous = {
  id: 'f1',
  name: 'كسكس مطبوخ',
  servingSize: 100,
  servingUnit: 'g' as const,
  calories: 112,
  proteinG: 3.8,
  carbsG: 23.2,
  fatG: 0.2,
  fiberG: 1.4,
};
const date = {
  id: 'f2',
  name: 'تمر',
  servingSize: 1,
  servingUnit: 'piece' as const,
  calories: 23,
  proteinG: 0.2,
  carbsG: 6,
  fatG: 0,
  fiberG: 0.6,
};

describe('plan items', () => {
  it('scales per-serving values to the quantity in the food unit', () => {
    expect(planItemFromFood(couscous, 150)).toEqual({
      foodId: 'f1',
      foodName: 'كسكس مطبوخ',
      quantity: 150,
      unit: 'g',
      calories: 168,
      proteinG: 5.7,
      carbsG: 34.8,
      fatG: 0.3,
      fiberG: 2.1,
    });
    expect(planItemFromFood(date, 3)).toMatchObject({ unit: 'piece', calories: 69, carbsG: 18 });
  });

  it('re-scales a snapshotted item without the food', () => {
    const item = planItemFromFood(couscous, 150);
    expect(scalePlanItem(item, 300)).toMatchObject({ quantity: 300, calories: 336, carbsG: 69.6 });
  });

  it('sums meals and days', () => {
    const meal = { items: [planItemFromFood(couscous, 200), planItemFromFood(date, 3)] };
    expect(mealTotals(meal)).toEqual({
      calories: 293,
      proteinG: 8.2,
      carbsG: 64.4,
      fatG: 0.4,
      fiberG: 4.6,
    });
    expect(dayTotals({ meals: [meal, meal] }).calories).toBe(586);
    expect(dayTotals({ meals: [] })).toEqual({
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
    });
  });
});

describe('macroGrams', () => {
  it('converts percentages at 4/4/9 kcal per gram', () => {
    expect(macroGrams(1500, { proteinPct: 30, carbsPct: 40, fatPct: 30 })).toEqual({
      proteinG: 113,
      carbsG: 150,
      fatG: 50,
    });
  });
});

describe('suggestCalories (Mifflin-St Jeor)', () => {
  it('computes BMR, TDEE and the goal-adjusted suggestion', () => {
    // The mockup patient: female, 68 kg, 1.65 m, 32 years, light activity, weight loss.
    const s = suggestCalories({
      gender: 'female',
      weightKg: 68,
      heightM: 1.65,
      age: 32,
      activityLevel: 'light',
      goal: 'weight_loss',
    });
    expect(s.bmr).toBe(1390); // 680 + 1031.25 − 160 − 161 = 1390.25
    expect(s.tdee).toBe(1912); // × 1.375
    expect(s.adjustment).toBe(-500);
    expect(s.suggested).toBe(1400); // 1911.6 − 500 → nearest 50
  });

  it('uses +5 for men and adds the gain surplus', () => {
    const s = suggestCalories({
      gender: 'male',
      weightKg: 61,
      heightM: 1.78,
      age: 41,
      activityLevel: 'moderate',
      goal: 'weight_gain',
    });
    expect(s.bmr).toBe(1523); // 610 + 1112.5 − 205 + 5
    expect(s.suggested).toBe(2750); // 1523 × 1.55 + 400 = 2761 → 2750
  });

  it('never suggests below 1200 kcal', () => {
    const s = suggestCalories({
      gender: 'female',
      weightKg: 45,
      heightM: 1.5,
      age: 70,
      activityLevel: 'sedentary',
      goal: 'weight_loss',
    });
    expect(s.suggested).toBe(1200);
  });
});

describe('planEndDate', () => {
  it('is start + weeks × 7 − 1', () => {
    expect(planEndDate('2026-09-15', 4)).toBe('2026-10-12');
    expect(planEndDate('2026-12-28', 1)).toBe('2027-01-03');
  });
});
