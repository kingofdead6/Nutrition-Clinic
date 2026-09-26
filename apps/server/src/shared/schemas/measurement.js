// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import { BMI_CATEGORIES } from '../enums.js';
import {
  baseEntitySchema,
  dateOnlySchema,
  idSchema,
  optionalText,
  toPatchSchema,
} from './common.js';
const optionalMetric = (min, max) => z.number().min(min).max(max).nullable().default(null);
/** Values recorded at a visit. */
const measurementInputFields = {
  date: dateOnlySchema,
  weightKg: z.number().min(2).max(350),
  heightM: z.number().min(0.4).max(2.5),
  waistCm: optionalMetric(30, 250),
  hipCm: optionalMetric(30, 250),
  bodyFatPct: optionalMetric(2, 75),
  muscleMassKg: optionalMetric(5, 150),
  visceralFat: optionalMetric(1, 60),
  waterPct: optionalMetric(20, 80),
  notes: optionalText(2000),
};
export const measurementSchema = baseEntitySchema.extend({
  ...measurementInputFields,
  patientId: idSchema,
  /** Derived on the server via shared helpers; never trusted from the client. */
  bmi: z.number(),
  bmiCategory: z.enum(BMI_CATEGORIES),
  waistHipRatio: z.number().nullable(),
});
export const measurementCreateSchema = z.object(measurementInputFields);
export const measurementUpdateSchema = toPatchSchema(measurementCreateSchema);
