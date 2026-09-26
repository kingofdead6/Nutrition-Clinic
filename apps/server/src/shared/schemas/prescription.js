// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import { PRESCRIPTION_TYPES } from '../enums.js';
import { baseEntitySchema, dateOnlySchema, idSchema, toPatchSchema } from './common.js';
const lines = z.array(z.string().trim().min(1).max(300)).max(60).default([]);
/** Placeholders available in template bodies, e.g. `{{patientName}}`. */
export const PRESCRIPTION_PLACEHOLDERS = [
  'patientName',
  'patientAge',
  'patientGender',
  'fileNumber',
  'date',
  'weightKg',
  'heightM',
  'bmi',
  'targetWeightKg',
  'dailyCalories',
  'planTitle',
  'practitionerName',
  'clinicName',
];
const templateInputFields = {
  name: z.string().trim().min(1, { error: 'validation.required' }).max(160),
  type: z.enum(PRESCRIPTION_TYPES),
  /** Limited, sanitized HTML with `{{placeholder}}` tokens. */
  bodyRichText: z.string().max(50_000).default(''),
  recommendations: lines,
  foodsToAvoid: lines,
  foodsToFavor: lines,
};
export const prescriptionTemplateSchema = baseEntitySchema.extend(templateInputFields);
export const prescriptionTemplateCreateSchema = z.object(templateInputFields);
export const prescriptionTemplateUpdateSchema = toPatchSchema(prescriptionTemplateCreateSchema);
/** An issued prescription: everything printed is snapshotted at issue time. */
export const prescriptionSchema = baseEntitySchema.extend({
  patientId: idSchema,
  templateId: idSchema.nullable(),
  dietPlanId: idSchema.nullable(),
  type: z.enum(PRESCRIPTION_TYPES),
  title: z.string(),
  date: dateOnlySchema,
  renderedContent: z.string(),
  recommendations: z.array(z.string()),
  foodsToAvoid: z.array(z.string()),
  foodsToFavor: z.array(z.string()),
});
export const prescriptionCreateSchema = z.object({
  patientId: idSchema,
  templateId: idSchema,
  dietPlanId: idSchema.nullable().default(null),
  date: dateOnlySchema.optional(),
});
/** Edits after issuing (e.g. tweak the rendered text before printing). */
export const prescriptionUpdateSchema = toPatchSchema(
  z.object({
    title: z.string().trim().min(1).max(160),
    date: dateOnlySchema,
    renderedContent: z.string().max(100_000),
    recommendations: lines,
    foodsToAvoid: lines,
    foodsToFavor: lines,
  }),
);
/** POST /prescriptions/preview renders without saving (same body as create). */
export const prescriptionPreviewSchema = prescriptionCreateSchema;
export const prescriptionListQuerySchema = z.object({
  patientId: idSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});
