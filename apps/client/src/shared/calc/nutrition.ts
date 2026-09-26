import type { ActivityLevel, Gender, PatientGoal } from '../enums';
import type { Food } from '../schemas/food';
import type { MacroTargets, NutritionTotals, PlanItem, PlanMeal } from '../schemas/dietPlan';
import { addDays } from './dateOnly';
import { roundTo } from './health';

export const NUTRIENT_KEYS = ['calories', 'proteinG', 'carbsG', 'fatG', 'fiberG'] as const;

export const ZERO_TOTALS: NutritionTotals = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
};

const roundTotals = (t: NutritionTotals): NutritionTotals => ({
  calories: Math.round(t.calories),
  proteinG: roundTo(t.proteinG, 1),
  carbsG: roundTo(t.carbsG, 1),
  fatG: roundTo(t.fatG, 1),
  fiberG: roundTo(t.fiberG, 1),
});

/**
 * A plan item for `quantity` of a food, expressed in the food's own serving unit
 * (grams of a food listed per 100 g, pieces of a food listed per piece, …).
 * Name and nutrition are snapshotted, so later food edits never change issued plans.
 */
export function planItemFromFood(
  food: Pick<
    Food,
    | 'id'
    | 'name'
    | 'servingSize'
    | 'servingUnit'
    | 'calories'
    | 'proteinG'
    | 'carbsG'
    | 'fatG'
    | 'fiberG'
  >,
  quantity: number,
): PlanItem {
  const factor = quantity / food.servingSize;
  return {
    foodId: food.id,
    foodName: food.name,
    quantity,
    unit: food.servingUnit,
    ...roundTotals({
      calories: food.calories * factor,
      proteinG: food.proteinG * factor,
      carbsG: food.carbsG * factor,
      fatG: food.fatG * factor,
      fiberG: food.fiberG * factor,
    }),
  };
}

/** Re-scales an existing (snapshotted) item to a new quantity without needing the food. */
export function scalePlanItem(item: PlanItem, quantity: number): PlanItem {
  if (item.quantity <= 0) return { ...item, quantity };
  const f = quantity / item.quantity;
  return {
    ...item,
    quantity,
    ...roundTotals({
      calories: item.calories * f,
      proteinG: item.proteinG * f,
      carbsG: item.carbsG * f,
      fatG: item.fatG * f,
      fiberG: item.fiberG * f,
    }),
  };
}

export function sumNutrition(parts: readonly NutritionTotals[]): NutritionTotals {
  const sum = { ...ZERO_TOTALS };
  for (const p of parts) for (const k of NUTRIENT_KEYS) sum[k] += p[k];
  return roundTotals(sum);
}

export const mealTotals = (meal: Pick<PlanMeal, 'items'>): NutritionTotals =>
  sumNutrition(meal.items);

export const dayTotals = (day: {
  meals: ReadonlyArray<Pick<PlanMeal, 'items'>>;
}): NutritionTotals => sumNutrition(day.meals.map(mealTotals));

/** Macro targets in grams: protein & carbs 4 kcal/g, fat 9 kcal/g. */
export function macroGrams(dailyCalories: number, m: MacroTargets) {
  return {
    proteinG: Math.round((dailyCalories * m.proteinPct) / 100 / 4),
    carbsG: Math.round((dailyCalories * m.carbsPct) / 100 / 4),
    fatG: Math.round((dailyCalories * m.fatPct) / 100 / 9),
  };
}

/** Starting macro split per goal (suggestion only). */
export const DEFAULT_MACROS: Record<PatientGoal, MacroTargets> = {
  weight_loss: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
  weight_gain: { proteinPct: 20, carbsPct: 50, fatPct: 30 },
  maintenance: { proteinPct: 20, carbsPct: 50, fatPct: 30 },
  therapeutic: { proteinPct: 20, carbsPct: 50, fatPct: 30 },
};

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** kcal/day added to maintenance for each goal. */
export const GOAL_ADJUSTMENT_KCAL: Record<PatientGoal, number> = {
  weight_loss: -500,
  weight_gain: 400,
  maintenance: 0,
  therapeutic: 0,
};

/** Never suggest less than this, whatever the arithmetic says. */
export const MIN_SUGGESTED_KCAL = 1200;

export interface CalorieSuggestion {
  bmr: number;
  activityFactor: number;
  tdee: number;
  adjustment: number;
  /** tdee + adjustment, floored at MIN_SUGGESTED_KCAL and rounded to 50 kcal. */
  suggested: number;
}

/**
 * Mifflin-St Jeor BMR × activity factor ± goal adjustment. A suggestion shown to the
 * practitioner, never applied automatically.
 */
export function suggestCalories(input: {
  gender: Gender;
  weightKg: number;
  heightM: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: PatientGoal;
}): CalorieSuggestion {
  const bmr =
    10 * input.weightKg +
    6.25 * input.heightM * 100 -
    5 * input.age +
    (input.gender === 'male' ? 5 : -161);
  const activityFactor = ACTIVITY_FACTORS[input.activityLevel];
  const tdee = bmr * activityFactor;
  const adjustment = GOAL_ADJUSTMENT_KCAL[input.goal];
  const suggested = Math.round(Math.max(MIN_SUGGESTED_KCAL, tdee + adjustment) / 50) * 50;
  return { bmr: Math.round(bmr), activityFactor, tdee: Math.round(tdee), adjustment, suggested };
}

/** Last day of a plan: start + weeks × 7 − 1 (a 4-week plan from 09/15 ends 10/12). */
export function planEndDate(startDate: string, durationWeeks: number): string {
  return addDays(startDate, durationWeeks * 7 - 1);
}
