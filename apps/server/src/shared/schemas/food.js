// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import { FOOD_CATEGORIES, SERVING_UNITS } from '../enums.js';
import { baseEntitySchema, paginationQuerySchema, toPatchSchema } from './common.js';
const nutrient = z.number().min(0).max(10000);
const foodInputFields = {
  name: z.string().trim().min(1, { error: 'validation.required' }).max(120),
  nameFr: z.string().trim().max(120).default(''),
  category: z.enum(FOOD_CATEGORIES),
  servingSize: z.number().positive().max(5000),
  servingUnit: z.enum(SERVING_UNITS),
  /** Nutrition values are per one serving (servingSize × servingUnit). */
  calories: nutrient,
  proteinG: nutrient,
  carbsG: nutrient,
  fatG: nutrient,
  fiberG: nutrient.default(0),
};
export const foodSchema = baseEntitySchema.extend({
  ...foodInputFields,
  isCustom: z.boolean(),
});
export const foodCreateSchema = z.object(foodInputFields);
export const foodUpdateSchema = toPatchSchema(foodCreateSchema);
export const foodListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.enum(FOOD_CATEGORIES).optional(),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
});
/** CSV columns accepted by the food import, in template order. */
export const FOOD_CSV_COLUMNS = [
  'name',
  'nameFr',
  'category',
  'servingSize',
  'servingUnit',
  'calories',
  'proteinG',
  'carbsG',
  'fatG',
  'fiberG',
];
