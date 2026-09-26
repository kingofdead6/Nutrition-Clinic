// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
export declare const macroTargetsSchema: z.ZodObject<
  {
    proteinPct: z.ZodNumber;
    carbsPct: z.ZodNumber;
    fatPct: z.ZodNumber;
  },
  z.core.$strip
>;
export type MacroTargets = z.infer<typeof macroTargetsSchema>;
export interface NutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}
/** What the client sends for a meal item. */
export declare const planItemInputSchema: z.ZodObject<
  {
    foodId: z.ZodUUID;
    quantity: z.ZodNumber;
    unit: z.ZodEnum<{
      g: 'g';
      ml: 'ml';
      piece: 'piece';
      cup: 'cup';
      tbsp: 'tbsp';
    }>;
  },
  z.core.$strip
>;
/**
 * Stored meal item. Food name and nutrition are snapshotted by the server when the
 * plan is saved, so editing or deleting a food never changes an issued plan.
 */
export declare const planItemSchema: z.ZodObject<
  {
    foodId: z.ZodUUID;
    quantity: z.ZodNumber;
    unit: z.ZodEnum<{
      g: 'g';
      ml: 'ml';
      piece: 'piece';
      cup: 'cup';
      tbsp: 'tbsp';
    }>;
    foodName: z.ZodString;
    calories: z.ZodNumber;
    proteinG: z.ZodNumber;
    carbsG: z.ZodNumber;
    fatG: z.ZodNumber;
    fiberG: z.ZodNumber;
  },
  z.core.$strip
>;
export type PlanItem = z.infer<typeof planItemSchema>;
export declare const planMealInputSchema: z.ZodObject<
  {
    items: z.ZodArray<
      z.ZodObject<
        {
          foodId: z.ZodUUID;
          quantity: z.ZodNumber;
          unit: z.ZodEnum<{
            g: 'g';
            ml: 'ml';
            piece: 'piece';
            cup: 'cup';
            tbsp: 'tbsp';
          }>;
        },
        z.core.$strip
      >
    >;
    mealType: z.ZodEnum<{
      breakfast: 'breakfast';
      morning_snack: 'morning_snack';
      lunch: 'lunch';
      afternoon_snack: 'afternoon_snack';
      dinner: 'dinner';
    }>;
    time: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    notes: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export declare const planMealSchema: z.ZodObject<
  {
    items: z.ZodArray<
      z.ZodObject<
        {
          foodId: z.ZodUUID;
          quantity: z.ZodNumber;
          unit: z.ZodEnum<{
            g: 'g';
            ml: 'ml';
            piece: 'piece';
            cup: 'cup';
            tbsp: 'tbsp';
          }>;
          foodName: z.ZodString;
          calories: z.ZodNumber;
          proteinG: z.ZodNumber;
          carbsG: z.ZodNumber;
          fatG: z.ZodNumber;
          fiberG: z.ZodNumber;
        },
        z.core.$strip
      >
    >;
    mealType: z.ZodEnum<{
      breakfast: 'breakfast';
      morning_snack: 'morning_snack';
      lunch: 'lunch';
      afternoon_snack: 'afternoon_snack';
      dinner: 'dinner';
    }>;
    time: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    notes: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type PlanMeal = z.infer<typeof planMealSchema>;
export declare const planDayInputSchema: z.ZodObject<
  {
    day: z.ZodEnum<{
      sun: 'sun';
      mon: 'mon';
      tue: 'tue';
      wed: 'wed';
      thu: 'thu';
      fri: 'fri';
      sat: 'sat';
      daily: 'daily';
    }>;
    meals: z.ZodArray<
      z.ZodObject<
        {
          items: z.ZodArray<
            z.ZodObject<
              {
                foodId: z.ZodUUID;
                quantity: z.ZodNumber;
                unit: z.ZodEnum<{
                  g: 'g';
                  ml: 'ml';
                  piece: 'piece';
                  cup: 'cup';
                  tbsp: 'tbsp';
                }>;
              },
              z.core.$strip
            >
          >;
          mealType: z.ZodEnum<{
            breakfast: 'breakfast';
            morning_snack: 'morning_snack';
            lunch: 'lunch';
            afternoon_snack: 'afternoon_snack';
            dinner: 'dinner';
          }>;
          time: z.ZodDefault<z.ZodNullable<z.ZodString>>;
          notes: z.ZodDefault<z.ZodString>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export declare const planDaySchema: z.ZodObject<
  {
    day: z.ZodEnum<{
      sun: 'sun';
      mon: 'mon';
      tue: 'tue';
      wed: 'wed';
      thu: 'thu';
      fri: 'fri';
      sat: 'sat';
      daily: 'daily';
    }>;
    meals: z.ZodArray<
      z.ZodObject<
        {
          items: z.ZodArray<
            z.ZodObject<
              {
                foodId: z.ZodUUID;
                quantity: z.ZodNumber;
                unit: z.ZodEnum<{
                  g: 'g';
                  ml: 'ml';
                  piece: 'piece';
                  cup: 'cup';
                  tbsp: 'tbsp';
                }>;
                foodName: z.ZodString;
                calories: z.ZodNumber;
                proteinG: z.ZodNumber;
                carbsG: z.ZodNumber;
                fatG: z.ZodNumber;
                fiberG: z.ZodNumber;
              },
              z.core.$strip
            >
          >;
          mealType: z.ZodEnum<{
            breakfast: 'breakfast';
            morning_snack: 'morning_snack';
            lunch: 'lunch';
            afternoon_snack: 'afternoon_snack';
            dinner: 'dinner';
          }>;
          time: z.ZodDefault<z.ZodNullable<z.ZodString>>;
          notes: z.ZodDefault<z.ZodString>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export type PlanDay = z.infer<typeof planDaySchema>;
export declare const dietPlanSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    days: z.ZodArray<
      z.ZodObject<
        {
          day: z.ZodEnum<{
            sun: 'sun';
            mon: 'mon';
            tue: 'tue';
            wed: 'wed';
            thu: 'thu';
            fri: 'fri';
            sat: 'sat';
            daily: 'daily';
          }>;
          meals: z.ZodArray<
            z.ZodObject<
              {
                items: z.ZodArray<
                  z.ZodObject<
                    {
                      foodId: z.ZodUUID;
                      quantity: z.ZodNumber;
                      unit: z.ZodEnum<{
                        g: 'g';
                        ml: 'ml';
                        piece: 'piece';
                        cup: 'cup';
                        tbsp: 'tbsp';
                      }>;
                      foodName: z.ZodString;
                      calories: z.ZodNumber;
                      proteinG: z.ZodNumber;
                      carbsG: z.ZodNumber;
                      fatG: z.ZodNumber;
                      fiberG: z.ZodNumber;
                    },
                    z.core.$strip
                  >
                >;
                mealType: z.ZodEnum<{
                  breakfast: 'breakfast';
                  morning_snack: 'morning_snack';
                  lunch: 'lunch';
                  afternoon_snack: 'afternoon_snack';
                  dinner: 'dinner';
                }>;
                time: z.ZodDefault<z.ZodNullable<z.ZodString>>;
                notes: z.ZodDefault<z.ZodString>;
              },
              z.core.$strip
            >
          >;
        },
        z.core.$strip
      >
    >;
    endDate: z.ZodISODate;
    isActive: z.ZodBoolean;
    patientId: z.ZodNullable<z.ZodUUID>;
    title: z.ZodString;
    goal: z.ZodEnum<{
      weight_loss: 'weight_loss';
      weight_gain: 'weight_gain';
      maintenance: 'maintenance';
      therapeutic: 'therapeutic';
    }>;
    dailyCalories: z.ZodNumber;
    macroTargets: z.ZodObject<
      {
        proteinPct: z.ZodNumber;
        carbsPct: z.ZodNumber;
        fatPct: z.ZodNumber;
      },
      z.core.$strip
    >;
    startDate: z.ZodISODate;
    durationWeeks: z.ZodNumber;
    notes: z.ZodDefault<z.ZodString>;
    isTemplate: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strip
>;
export type DietPlan = z.infer<typeof dietPlanSchema>;
export declare const dietPlanCreateSchema: z.ZodObject<
  {
    days: z.ZodDefault<
      z.ZodArray<
        z.ZodObject<
          {
            day: z.ZodEnum<{
              sun: 'sun';
              mon: 'mon';
              tue: 'tue';
              wed: 'wed';
              thu: 'thu';
              fri: 'fri';
              sat: 'sat';
              daily: 'daily';
            }>;
            meals: z.ZodArray<
              z.ZodObject<
                {
                  items: z.ZodArray<
                    z.ZodObject<
                      {
                        foodId: z.ZodUUID;
                        quantity: z.ZodNumber;
                        unit: z.ZodEnum<{
                          g: 'g';
                          ml: 'ml';
                          piece: 'piece';
                          cup: 'cup';
                          tbsp: 'tbsp';
                        }>;
                      },
                      z.core.$strip
                    >
                  >;
                  mealType: z.ZodEnum<{
                    breakfast: 'breakfast';
                    morning_snack: 'morning_snack';
                    lunch: 'lunch';
                    afternoon_snack: 'afternoon_snack';
                    dinner: 'dinner';
                  }>;
                  time: z.ZodDefault<z.ZodNullable<z.ZodString>>;
                  notes: z.ZodDefault<z.ZodString>;
                },
                z.core.$strip
              >
            >;
          },
          z.core.$strip
        >
      >
    >;
    activate: z.ZodDefault<z.ZodBoolean>;
    patientId: z.ZodNullable<z.ZodUUID>;
    title: z.ZodString;
    goal: z.ZodEnum<{
      weight_loss: 'weight_loss';
      weight_gain: 'weight_gain';
      maintenance: 'maintenance';
      therapeutic: 'therapeutic';
    }>;
    dailyCalories: z.ZodNumber;
    macroTargets: z.ZodObject<
      {
        proteinPct: z.ZodNumber;
        carbsPct: z.ZodNumber;
        fatPct: z.ZodNumber;
      },
      z.core.$strip
    >;
    startDate: z.ZodISODate;
    durationWeeks: z.ZodNumber;
    notes: z.ZodDefault<z.ZodString>;
    isTemplate: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strip
>;
export type DietPlanCreateInput = z.infer<typeof dietPlanCreateSchema>;
export declare const dietPlanUpdateSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    days: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            day: z.ZodEnum<{
              sun: 'sun';
              mon: 'mon';
              tue: 'tue';
              wed: 'wed';
              thu: 'thu';
              fri: 'fri';
              sat: 'sat';
              daily: 'daily';
            }>;
            meals: z.ZodArray<
              z.ZodObject<
                {
                  items: z.ZodArray<
                    z.ZodObject<
                      {
                        foodId: z.ZodUUID;
                        quantity: z.ZodNumber;
                        unit: z.ZodEnum<{
                          g: 'g';
                          ml: 'ml';
                          piece: 'piece';
                          cup: 'cup';
                          tbsp: 'tbsp';
                        }>;
                      },
                      z.core.$strip
                    >
                  >;
                  mealType: z.ZodEnum<{
                    breakfast: 'breakfast';
                    morning_snack: 'morning_snack';
                    lunch: 'lunch';
                    afternoon_snack: 'afternoon_snack';
                    dinner: 'dinner';
                  }>;
                  time: z.ZodDefault<z.ZodNullable<z.ZodString>>;
                  notes: z.ZodDefault<z.ZodString>;
                },
                z.core.$strip
              >
            >;
          },
          z.core.$strip
        >
      >
    >;
    patientId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    goal: z.ZodOptional<
      z.ZodEnum<{
        weight_loss: 'weight_loss';
        weight_gain: 'weight_gain';
        maintenance: 'maintenance';
        therapeutic: 'therapeutic';
      }>
    >;
    dailyCalories: z.ZodOptional<z.ZodNumber>;
    macroTargets: z.ZodOptional<
      z.ZodObject<
        {
          proteinPct: z.ZodNumber;
          carbsPct: z.ZodNumber;
          fatPct: z.ZodNumber;
        },
        z.core.$strip
      >
    >;
    startDate: z.ZodOptional<z.ZodISODate>;
    durationWeeks: z.ZodOptional<z.ZodNumber>;
    isTemplate: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
>;
export type DietPlanUpdateInput = z.infer<typeof dietPlanUpdateSchema>;
export declare const dietPlanListQuerySchema: z.ZodObject<
  {
    patientId: z.ZodOptional<z.ZodUUID>;
    isTemplate: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
    isActive: z.ZodOptional<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
>;
export type DietPlanListQuery = z.infer<typeof dietPlanListQuerySchema>;
/**
 * POST /diet-plans/:id/duplicate — copy a plan: to the same patient, to another patient
 * (e.g. applying a template), or as a reusable template (`isTemplate: true`).
 */
export declare const dietPlanDuplicateSchema: z.ZodObject<
  {
    patientId: z.ZodOptional<z.ZodNullable<z.ZodUUID>>;
    isTemplate: z.ZodDefault<z.ZodBoolean>;
    title: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodISODate>;
    activate: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strip
>;
export type DietPlanDuplicateInput = z.infer<typeof dietPlanDuplicateSchema>;
/** Plan joined with the patient summary lists need (joined in the service layer). */
export interface DietPlanWithPatient extends DietPlan {
  patient: {
    id: string;
    fullName: string;
    fileNumber: string;
  } | null;
}
