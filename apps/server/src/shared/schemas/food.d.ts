// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
export declare const foodSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    isCustom: z.ZodBoolean;
    name: z.ZodString;
    nameFr: z.ZodDefault<z.ZodString>;
    category: z.ZodEnum<{
      grains: 'grains';
      proteins: 'proteins';
      dairy: 'dairy';
      fruits: 'fruits';
      vegetables: 'vegetables';
      fats: 'fats';
      sweets: 'sweets';
      drinks: 'drinks';
      traditional: 'traditional';
    }>;
    servingSize: z.ZodNumber;
    servingUnit: z.ZodEnum<{
      g: 'g';
      ml: 'ml';
      piece: 'piece';
      cup: 'cup';
      tbsp: 'tbsp';
    }>;
    calories: z.ZodNumber;
    proteinG: z.ZodNumber;
    carbsG: z.ZodNumber;
    fatG: z.ZodNumber;
    fiberG: z.ZodDefault<z.ZodNumber>;
  },
  z.core.$strip
>;
export type Food = z.infer<typeof foodSchema>;
export declare const foodCreateSchema: z.ZodObject<
  {
    name: z.ZodString;
    nameFr: z.ZodDefault<z.ZodString>;
    category: z.ZodEnum<{
      grains: 'grains';
      proteins: 'proteins';
      dairy: 'dairy';
      fruits: 'fruits';
      vegetables: 'vegetables';
      fats: 'fats';
      sweets: 'sweets';
      drinks: 'drinks';
      traditional: 'traditional';
    }>;
    servingSize: z.ZodNumber;
    servingUnit: z.ZodEnum<{
      g: 'g';
      ml: 'ml';
      piece: 'piece';
      cup: 'cup';
      tbsp: 'tbsp';
    }>;
    calories: z.ZodNumber;
    proteinG: z.ZodNumber;
    carbsG: z.ZodNumber;
    fatG: z.ZodNumber;
    fiberG: z.ZodDefault<z.ZodNumber>;
  },
  z.core.$strip
>;
export type FoodCreateInput = z.infer<typeof foodCreateSchema>;
export type FoodFormValues = z.input<typeof foodCreateSchema>;
export declare const foodUpdateSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    nameFr: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<
      z.ZodEnum<{
        grains: 'grains';
        proteins: 'proteins';
        dairy: 'dairy';
        fruits: 'fruits';
        vegetables: 'vegetables';
        fats: 'fats';
        sweets: 'sweets';
        drinks: 'drinks';
        traditional: 'traditional';
      }>
    >;
    servingSize: z.ZodOptional<z.ZodNumber>;
    servingUnit: z.ZodOptional<
      z.ZodEnum<{
        g: 'g';
        ml: 'ml';
        piece: 'piece';
        cup: 'cup';
        tbsp: 'tbsp';
      }>
    >;
    calories: z.ZodOptional<z.ZodNumber>;
    proteinG: z.ZodOptional<z.ZodNumber>;
    carbsG: z.ZodOptional<z.ZodNumber>;
    fatG: z.ZodOptional<z.ZodNumber>;
    fiberG: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
>;
export type FoodUpdateInput = z.infer<typeof foodUpdateSchema>;
export declare const foodListQuerySchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<
      z.ZodEnum<{
        grains: 'grains';
        proteins: 'proteins';
        dairy: 'dairy';
        fruits: 'fruits';
        vegetables: 'vegetables';
        fats: 'fats';
        sweets: 'sweets';
        drinks: 'drinks';
        traditional: 'traditional';
      }>
    >;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
>;
export type FoodListQuery = z.infer<typeof foodListQuerySchema>;
/** Result of POST /foods/import (CSV). Line numbers count the header as line 1. */
export interface FoodImportResult {
  imported: number;
  skipped: number;
  errors: Array<{
    line: number;
    message: string;
    details?: string;
  }>;
  dryRun: boolean;
}
/** CSV columns accepted by the food import, in template order. */
export declare const FOOD_CSV_COLUMNS: readonly [
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
