// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
export declare const measurementSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    patientId: z.ZodUUID;
    bmi: z.ZodNumber;
    bmiCategory: z.ZodEnum<{
      underweight: 'underweight';
      normal: 'normal';
      overweight: 'overweight';
      obese_1: 'obese_1';
      obese_2: 'obese_2';
      obese_3: 'obese_3';
    }>;
    waistHipRatio: z.ZodNullable<z.ZodNumber>;
    date: z.ZodISODate;
    weightKg: z.ZodNumber;
    heightM: z.ZodNumber;
    waistCm: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    hipCm: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    bodyFatPct: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    muscleMassKg: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    visceralFat: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    waterPct: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    notes: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type Measurement = z.infer<typeof measurementSchema>;
export declare const measurementCreateSchema: z.ZodObject<
  {
    date: z.ZodISODate;
    weightKg: z.ZodNumber;
    heightM: z.ZodNumber;
    waistCm: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    hipCm: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    bodyFatPct: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    muscleMassKg: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    visceralFat: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    waterPct: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    notes: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type MeasurementCreateInput = z.infer<typeof measurementCreateSchema>;
export type MeasurementFormValues = z.input<typeof measurementCreateSchema>;
export declare const measurementUpdateSchema: z.ZodObject<
  {
    date: z.ZodOptional<z.ZodISODate>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    heightM: z.ZodOptional<z.ZodNumber>;
    waistCm: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    hipCm: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    bodyFatPct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    muscleMassKg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    visceralFat: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    waterPct: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
export type MeasurementUpdateInput = z.infer<typeof measurementUpdateSchema>;
