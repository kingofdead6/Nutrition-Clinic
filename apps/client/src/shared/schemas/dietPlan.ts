import { z } from 'zod';
import { MEAL_TYPES, PATIENT_GOALS, PLAN_DAY_KEYS, SERVING_UNITS } from '../enums';
import {
  baseEntitySchema,
  dateOnlySchema,
  idSchema,
  optionalText,
  timeSchema,
  toPatchSchema,
} from './common';

export const macroTargetsSchema = z
  .object({
    proteinPct: z.number().min(0).max(100),
    carbsPct: z.number().min(0).max(100),
    fatPct: z.number().min(0).max(100),
  })
  .refine((m) => Math.round(m.proteinPct + m.carbsPct + m.fatPct) === 100, {
    error: 'validation.macrosSum',
  });
export type MacroTargets = z.infer<typeof macroTargetsSchema>;

export interface NutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

/** What the client sends for a meal item. */
export const planItemInputSchema = z.object({
  foodId: idSchema,
  quantity: z.number().positive().max(5000),
  unit: z.enum(SERVING_UNITS),
});

/**
 * Stored meal item. Food name and nutrition are snapshotted by the server when the
 * plan is saved, so editing or deleting a food never changes an issued plan.
 */
export const planItemSchema = planItemInputSchema.extend({
  foodName: z.string(),
  calories: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  fiberG: z.number(),
});
export type PlanItem = z.infer<typeof planItemSchema>;

const mealBase = {
  mealType: z.enum(MEAL_TYPES),
  time: timeSchema.nullable().default(null),
  notes: optionalText(500),
};

export const planMealInputSchema = z.object({
  ...mealBase,
  items: z.array(planItemInputSchema).max(40),
});
export const planMealSchema = z.object({ ...mealBase, items: z.array(planItemSchema) });
export type PlanMeal = z.infer<typeof planMealSchema>;

export const planDayInputSchema = z.object({
  day: z.enum(PLAN_DAY_KEYS),
  meals: z.array(planMealInputSchema).max(10),
});
export const planDaySchema = z.object({
  day: z.enum(PLAN_DAY_KEYS),
  meals: z.array(planMealSchema),
});
export type PlanDay = z.infer<typeof planDaySchema>;

const dietPlanInputFields = {
  /** Null only for reusable templates. */
  patientId: idSchema.nullable(),
  title: z.string().trim().min(1, { error: 'validation.required' }).max(160),
  goal: z.enum(PATIENT_GOALS),
  dailyCalories: z.number().int().min(600).max(6000),
  macroTargets: macroTargetsSchema,
  startDate: dateOnlySchema,
  durationWeeks: z.number().int().min(1).max(104),
  notes: optionalText(4000),
  isTemplate: z.boolean().default(false),
};

export const dietPlanSchema = baseEntitySchema.extend({
  ...dietPlanInputFields,
  days: z.array(planDaySchema),
  /** Derived: startDate + durationWeeks × 7 − 1 day. */
  endDate: dateOnlySchema,
  isActive: z.boolean(),
});
export type DietPlan = z.infer<typeof dietPlanSchema>;

export const dietPlanCreateSchema = z.object({
  ...dietPlanInputFields,
  days: z
    .array(planDayInputSchema)
    .max(8)
    .default([{ day: 'daily', meals: [] }]),
  /** Activate immediately (deactivates the patient's previous active plan). */
  activate: z.boolean().default(true),
});
export type DietPlanCreateInput = z.infer<typeof dietPlanCreateSchema>;

export const dietPlanUpdateSchema = toPatchSchema(dietPlanCreateSchema.omit({ activate: true }));
export type DietPlanUpdateInput = z.infer<typeof dietPlanUpdateSchema>;

const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

export const dietPlanListQuerySchema = z.object({
  patientId: idSchema.optional(),
  isTemplate: booleanQuery.optional(),
  isActive: booleanQuery.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});
export type DietPlanListQuery = z.infer<typeof dietPlanListQuerySchema>;

/**
 * POST /diet-plans/:id/duplicate — copy a plan: to the same patient, to another patient
 * (e.g. applying a template), or as a reusable template (`isTemplate: true`).
 */
export const dietPlanDuplicateSchema = z.object({
  patientId: idSchema.nullable().optional(),
  isTemplate: z.boolean().default(false),
  title: z.string().trim().min(1).max(160).optional(),
  startDate: dateOnlySchema.optional(),
  activate: z.boolean().default(false),
});
export type DietPlanDuplicateInput = z.infer<typeof dietPlanDuplicateSchema>;

/** Plan joined with the patient summary lists need (joined in the service layer). */
export interface DietPlanWithPatient extends DietPlan {
  patient: { id: string; fullName: string; fileNumber: string } | null;
}
