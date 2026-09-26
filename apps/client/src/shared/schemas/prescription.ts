import { z } from 'zod';
import { PRESCRIPTION_TYPES } from '../enums';
import { baseEntitySchema, dateOnlySchema, idSchema, toPatchSchema } from './common';

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
] as const;
export type PrescriptionPlaceholder = (typeof PRESCRIPTION_PLACEHOLDERS)[number];

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
export type PrescriptionTemplate = z.infer<typeof prescriptionTemplateSchema>;

export const prescriptionTemplateCreateSchema = z.object(templateInputFields);
export type PrescriptionTemplateCreateInput = z.infer<typeof prescriptionTemplateCreateSchema>;

export const prescriptionTemplateUpdateSchema = toPatchSchema(prescriptionTemplateCreateSchema);
export type PrescriptionTemplateUpdateInput = z.infer<typeof prescriptionTemplateUpdateSchema>;

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
export type Prescription = z.infer<typeof prescriptionSchema>;

export const prescriptionCreateSchema = z.object({
  patientId: idSchema,
  templateId: idSchema,
  dietPlanId: idSchema.nullable().default(null),
  date: dateOnlySchema.optional(),
});
export type PrescriptionCreateInput = z.infer<typeof prescriptionCreateSchema>;

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
export type PrescriptionUpdateInput = z.infer<typeof prescriptionUpdateSchema>;

/** POST /prescriptions/preview renders without saving (same body as create). */
export const prescriptionPreviewSchema = prescriptionCreateSchema;

/** Prescription joined with the patient summary the lists and the print view need. */
export interface PrescriptionWithPatient extends Prescription {
  patient: {
    id: string;
    fullName: string;
    fileNumber: string;
    birthDate: string;
    gender: 'male' | 'female';
  } | null;
}

export interface PrescriptionPreview {
  title: string;
  type: Prescription['type'];
  date: string;
  renderedContent: string;
  recommendations: string[];
  foodsToAvoid: string[];
  foodsToFavor: string[];
}

export const prescriptionListQuerySchema = z.object({
  patientId: idSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});
export type PrescriptionListQuery = z.infer<typeof prescriptionListQuerySchema>;
