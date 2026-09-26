// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
/** Placeholders available in template bodies, e.g. `{{patientName}}`. */
export declare const PRESCRIPTION_PLACEHOLDERS: readonly [
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
export type PrescriptionPlaceholder = (typeof PRESCRIPTION_PLACEHOLDERS)[number];
export declare const prescriptionTemplateSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    name: z.ZodString;
    type: z.ZodEnum<{
      weight_loss: 'weight_loss';
      weight_gain: 'weight_gain';
      balanced: 'balanced';
      diabetic: 'diabetic';
      custom: 'custom';
    }>;
    bodyRichText: z.ZodDefault<z.ZodString>;
    recommendations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    foodsToAvoid: z.ZodDefault<z.ZodArray<z.ZodString>>;
    foodsToFavor: z.ZodDefault<z.ZodArray<z.ZodString>>;
  },
  z.core.$strip
>;
export type PrescriptionTemplate = z.infer<typeof prescriptionTemplateSchema>;
export declare const prescriptionTemplateCreateSchema: z.ZodObject<
  {
    name: z.ZodString;
    type: z.ZodEnum<{
      weight_loss: 'weight_loss';
      weight_gain: 'weight_gain';
      balanced: 'balanced';
      diabetic: 'diabetic';
      custom: 'custom';
    }>;
    bodyRichText: z.ZodDefault<z.ZodString>;
    recommendations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    foodsToAvoid: z.ZodDefault<z.ZodArray<z.ZodString>>;
    foodsToFavor: z.ZodDefault<z.ZodArray<z.ZodString>>;
  },
  z.core.$strip
>;
export type PrescriptionTemplateCreateInput = z.infer<typeof prescriptionTemplateCreateSchema>;
export declare const prescriptionTemplateUpdateSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<
      z.ZodEnum<{
        weight_loss: 'weight_loss';
        weight_gain: 'weight_gain';
        balanced: 'balanced';
        diabetic: 'diabetic';
        custom: 'custom';
      }>
    >;
    bodyRichText: z.ZodOptional<z.ZodString>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodString>>;
    foodsToAvoid: z.ZodOptional<z.ZodArray<z.ZodString>>;
    foodsToFavor: z.ZodOptional<z.ZodArray<z.ZodString>>;
  },
  z.core.$strip
>;
export type PrescriptionTemplateUpdateInput = z.infer<typeof prescriptionTemplateUpdateSchema>;
/** An issued prescription: everything printed is snapshotted at issue time. */
export declare const prescriptionSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    patientId: z.ZodUUID;
    templateId: z.ZodNullable<z.ZodUUID>;
    dietPlanId: z.ZodNullable<z.ZodUUID>;
    type: z.ZodEnum<{
      weight_loss: 'weight_loss';
      weight_gain: 'weight_gain';
      balanced: 'balanced';
      diabetic: 'diabetic';
      custom: 'custom';
    }>;
    title: z.ZodString;
    date: z.ZodISODate;
    renderedContent: z.ZodString;
    recommendations: z.ZodArray<z.ZodString>;
    foodsToAvoid: z.ZodArray<z.ZodString>;
    foodsToFavor: z.ZodArray<z.ZodString>;
  },
  z.core.$strip
>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export declare const prescriptionCreateSchema: z.ZodObject<
  {
    patientId: z.ZodUUID;
    templateId: z.ZodUUID;
    dietPlanId: z.ZodDefault<z.ZodNullable<z.ZodUUID>>;
    date: z.ZodOptional<z.ZodISODate>;
  },
  z.core.$strip
>;
export type PrescriptionCreateInput = z.infer<typeof prescriptionCreateSchema>;
/** Edits after issuing (e.g. tweak the rendered text before printing). */
export declare const prescriptionUpdateSchema: z.ZodObject<
  {
    title: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodISODate>;
    renderedContent: z.ZodOptional<z.ZodString>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodString>>;
    foodsToAvoid: z.ZodOptional<z.ZodArray<z.ZodString>>;
    foodsToFavor: z.ZodOptional<z.ZodArray<z.ZodString>>;
  },
  z.core.$strip
>;
export type PrescriptionUpdateInput = z.infer<typeof prescriptionUpdateSchema>;
/** POST /prescriptions/preview renders without saving (same body as create). */
export declare const prescriptionPreviewSchema: z.ZodObject<
  {
    patientId: z.ZodUUID;
    templateId: z.ZodUUID;
    dietPlanId: z.ZodDefault<z.ZodNullable<z.ZodUUID>>;
    date: z.ZodOptional<z.ZodISODate>;
  },
  z.core.$strip
>;
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
export declare const prescriptionListQuerySchema: z.ZodObject<
  {
    patientId: z.ZodOptional<z.ZodUUID>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
>;
export type PrescriptionListQuery = z.infer<typeof prescriptionListQuerySchema>;
