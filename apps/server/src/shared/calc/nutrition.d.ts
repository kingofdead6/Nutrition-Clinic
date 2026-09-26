// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import type { ActivityLevel, Gender, PatientGoal } from '../enums.js';
import type { Food } from '../schemas/food.js';
import type { MacroTargets, NutritionTotals, PlanItem, PlanMeal } from '../schemas/dietPlan.js';
export declare const NUTRIENT_KEYS: readonly ['calories', 'proteinG', 'carbsG', 'fatG', 'fiberG'];
export declare const ZERO_TOTALS: NutritionTotals;
/**
 * A plan item for `quantity` of a food, expressed in the food's own serving unit
 * (grams of a food listed per 100 g, pieces of a food listed per piece, …).
 * Name and nutrition are snapshotted, so later food edits never change issued plans.
 */
export declare function planItemFromFood(
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
): PlanItem;
/** Re-scales an existing (snapshotted) item to a new quantity without needing the food. */
export declare function scalePlanItem(item: PlanItem, quantity: number): PlanItem;
export declare function sumNutrition(parts: readonly NutritionTotals[]): NutritionTotals;
export declare const mealTotals: (meal: Pick<PlanMeal, 'items'>) => NutritionTotals;
export declare const dayTotals: (day: {
  meals: ReadonlyArray<Pick<PlanMeal, 'items'>>;
}) => NutritionTotals;
/** Macro targets in grams: protein & carbs 4 kcal/g, fat 9 kcal/g. */
export declare function macroGrams(
  dailyCalories: number,
  m: MacroTargets,
): {
  proteinG: number;
  carbsG: number;
  fatG: number;
};
/** Starting macro split per goal (suggestion only). */
export declare const DEFAULT_MACROS: Record<PatientGoal, MacroTargets>;
export declare const ACTIVITY_FACTORS: Record<ActivityLevel, number>;
/** kcal/day added to maintenance for each goal. */
export declare const GOAL_ADJUSTMENT_KCAL: Record<PatientGoal, number>;
/** Never suggest less than this, whatever the arithmetic says. */
export declare const MIN_SUGGESTED_KCAL = 1200;
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
export declare function suggestCalories(input: {
  gender: Gender;
  weightKg: number;
  heightM: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: PatientGoal;
}): CalorieSuggestion;
/** Last day of a plan: start + weeks × 7 − 1 (a 4-week plan from 09/15 ends 10/12). */
export declare function planEndDate(startDate: string, durationWeeks: number): string;
