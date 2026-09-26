import {
  DEFAULT_MACROS,
  MEAL_TYPES,
  roundTo,
  sumNutrition,
  WEEKDAYS,
  type DietPlan,
  type DietPlanCreateInput,
  type Food,
  type MacroTargets,
  type MealType,
  type NutritionTotals,
  type PatientGoal,
  type PlanDayKey,
  type ServingUnit,
} from '@shared';
import type { PatientChoice } from '../appointments/PatientCombobox';

/**
 * Editor state for the plan builder. Each item keeps its nutrition *per unit of
 * quantity*, so totals update live while typing and loaded plans can be re-scaled
 * without refetching foods. The server recomputes everything from the food database on save.
 */
export interface ItemState {
  key: string;
  foodId: string;
  foodName: string;
  unit: ServingUnit;
  quantity: number;
  perUnit: NutritionTotals;
}

export interface MealState {
  key: string;
  mealType: MealType;
  time: string | null;
  notes: string;
  items: ItemState[];
}

export interface DayState {
  day: PlanDayKey;
  meals: MealState[];
}

export interface PlanState {
  patient: PatientChoice | null;
  isTemplate: boolean;
  title: string;
  goal: PatientGoal;
  dailyCalories: number;
  macroTargets: MacroTargets;
  startDate: string;
  durationWeeks: number;
  notes: string;
  days: DayState[];
}

/** Algerian week order (Saturday first), matching the calendar. */
export const WEEK_ORDER: readonly PlanDayKey[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

let counter = 0;
export const newKey = () => `k${Date.now().toString(36)}${(counter++).toString(36)}`;

const MEAL_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  morning_snack: '10:30',
  lunch: '13:00',
  afternoon_snack: '16:30',
  dinner: '19:30',
};

export const newMeal = (mealType: MealType): MealState => ({
  key: newKey(),
  mealType,
  time: MEAL_TIMES[mealType],
  notes: '',
  items: [],
});

/** The five usual meals, empty. */
export const defaultMeals = (): MealState[] => MEAL_TYPES.map(newMeal);

export function itemFromFood(food: Food): ItemState {
  const per = (v: number) => v / food.servingSize;
  return {
    key: newKey(),
    foodId: food.id,
    foodName: food.name,
    unit: food.servingUnit,
    quantity: food.servingSize,
    perUnit: {
      calories: per(food.calories),
      proteinG: per(food.proteinG),
      carbsG: per(food.carbsG),
      fatG: per(food.fatG),
      fiberG: per(food.fiberG),
    },
  };
}

export function itemTotals(item: ItemState): NutritionTotals {
  const q = Number.isFinite(item.quantity) ? item.quantity : 0;
  return {
    calories: item.perUnit.calories * q,
    proteinG: item.perUnit.proteinG * q,
    carbsG: item.perUnit.carbsG * q,
    fatG: item.perUnit.fatG * q,
    fiberG: item.perUnit.fiberG * q,
  };
}

export const mealStateTotals = (meal: MealState) => sumNutrition(meal.items.map(itemTotals));
export const dayStateTotals = (day: DayState) => sumNutrition(day.meals.map(mealStateTotals));

export function emptyPlan(options: {
  patient: PatientChoice | null;
  goal?: PatientGoal;
  startDate: string;
  isTemplate: boolean;
}): PlanState {
  const goal = options.goal ?? 'weight_loss';
  return {
    patient: options.patient,
    isTemplate: options.isTemplate,
    title: '',
    goal,
    dailyCalories: 1500,
    macroTargets: { ...DEFAULT_MACROS[goal] },
    startDate: options.startDate,
    durationWeeks: 4,
    notes: '',
    days: [{ day: 'daily', meals: defaultMeals() }],
  };
}

export function planToState(
  plan: DietPlan & { patient: { id: string; fullName: string; fileNumber: string } | null },
  phone = '',
): PlanState {
  return {
    patient: plan.patient ? { ...plan.patient, phone } : null,
    isTemplate: plan.isTemplate,
    title: plan.title,
    goal: plan.goal,
    dailyCalories: plan.dailyCalories,
    macroTargets: { ...plan.macroTargets },
    startDate: plan.startDate,
    durationWeeks: plan.durationWeeks,
    notes: plan.notes,
    days: plan.days.map((d) => ({
      day: d.day,
      meals: d.meals.map((m) => ({
        key: newKey(),
        mealType: m.mealType,
        time: m.time,
        notes: m.notes,
        items: m.items.map((i) => {
          const per = (v: number) => (i.quantity > 0 ? v / i.quantity : 0);
          return {
            key: newKey(),
            foodId: i.foodId,
            foodName: i.foodName,
            unit: i.unit,
            quantity: i.quantity,
            perUnit: {
              calories: per(i.calories),
              proteinG: per(i.proteinG),
              carbsG: per(i.carbsG),
              fatG: per(i.fatG),
              fiberG: per(i.fiberG),
            },
          };
        }),
      })),
    })),
  };
}

export function stateToInput(s: PlanState): Omit<DietPlanCreateInput, 'activate'> {
  return {
    patientId: s.isTemplate ? null : (s.patient?.id ?? null),
    isTemplate: s.isTemplate,
    title: s.title,
    goal: s.goal,
    dailyCalories: s.dailyCalories,
    macroTargets: s.macroTargets,
    startDate: s.startDate,
    durationWeeks: s.durationWeeks,
    notes: s.notes,
    days: s.days.map((d) => ({
      day: d.day,
      meals: d.meals.map((m) => ({
        mealType: m.mealType,
        time: m.time,
        notes: m.notes,
        items: m.items.map((i) => ({
          foodId: i.foodId,
          quantity: roundTo(i.quantity, 2),
          unit: i.unit,
        })),
      })),
    })),
  };
}

const cloneMeals = (meals: MealState[]): MealState[] =>
  meals.map((m) => ({ ...m, key: newKey(), items: m.items.map((i) => ({ ...i, key: newKey() })) }));

/** Daily → one copy per weekday. */
export const toWeekly = (daily: DayState): DayState[] =>
  WEEK_ORDER.map((day) => ({ day, meals: cloneMeals(daily.meals) }));

/** Weekly → keep one day as the daily template. */
export const toDaily = (day: DayState): DayState[] => [
  { day: 'daily', meals: cloneMeals(day.meals) },
];

export const copyDayToAll = (days: DayState[], source: DayState): DayState[] =>
  days.map((d) => (d.day === source.day ? d : { day: d.day, meals: cloneMeals(source.meals) }));

export const isWeekday = (key: PlanDayKey) => (WEEKDAYS as readonly string[]).includes(key);
