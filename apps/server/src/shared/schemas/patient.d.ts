// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
export declare const patientSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    fileNumber: z.ZodString;
    fullName: z.ZodString;
    photoPath: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
      follow_up: 'follow_up';
      new_plan: 'new_plan';
      plan_ended: 'plan_ended';
      inactive: 'inactive';
    }>;
    archived: z.ZodBoolean;
    lastVisitDate: z.ZodNullable<z.ZodISODate>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    gender: z.ZodEnum<{
      male: 'male';
      female: 'female';
    }>;
    birthDate: z.ZodISODate;
    phone: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
    email: z.ZodDefault<z.ZodUnion<readonly [z.ZodEmail, z.ZodLiteral<''>]>>;
    address: z.ZodDefault<z.ZodString>;
    occupation: z.ZodDefault<z.ZodString>;
    chronicConditions: z.ZodDefault<
      z.ZodArray<
        z.ZodEnum<{
          diabetes_t1: 'diabetes_t1';
          diabetes_t2: 'diabetes_t2';
          hypertension: 'hypertension';
          hypothyroidism: 'hypothyroidism';
          hyperthyroidism: 'hyperthyroidism';
          celiac: 'celiac';
          dyslipidemia: 'dyslipidemia';
          pcos: 'pcos';
          kidney_disease: 'kidney_disease';
          other: 'other';
        }>
      >
    >;
    medicalNotes: z.ZodDefault<z.ZodString>;
    allergies: z.ZodDefault<z.ZodArray<z.ZodString>>;
    medications: z.ZodDefault<z.ZodArray<z.ZodString>>;
    activityLevel: z.ZodDefault<
      z.ZodEnum<{
        sedentary: 'sedentary';
        light: 'light';
        moderate: 'moderate';
        active: 'active';
        very_active: 'very_active';
      }>
    >;
    goal: z.ZodEnum<{
      weight_loss: 'weight_loss';
      weight_gain: 'weight_gain';
      maintenance: 'maintenance';
      therapeutic: 'therapeutic';
    }>;
    targetWeightKg: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    statusOverride: z.ZodDefault<
      z.ZodNullable<
        z.ZodEnum<{
          follow_up: 'follow_up';
          new_plan: 'new_plan';
          plan_ended: 'plan_ended';
          inactive: 'inactive';
        }>
      >
    >;
  },
  z.core.$strip
>;
export type Patient = z.infer<typeof patientSchema>;
export declare const patientCreateSchema: z.ZodObject<
  {
    firstName: z.ZodString;
    lastName: z.ZodString;
    gender: z.ZodEnum<{
      male: 'male';
      female: 'female';
    }>;
    birthDate: z.ZodISODate;
    phone: z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>;
    email: z.ZodDefault<z.ZodUnion<readonly [z.ZodEmail, z.ZodLiteral<''>]>>;
    address: z.ZodDefault<z.ZodString>;
    occupation: z.ZodDefault<z.ZodString>;
    chronicConditions: z.ZodDefault<
      z.ZodArray<
        z.ZodEnum<{
          diabetes_t1: 'diabetes_t1';
          diabetes_t2: 'diabetes_t2';
          hypertension: 'hypertension';
          hypothyroidism: 'hypothyroidism';
          hyperthyroidism: 'hyperthyroidism';
          celiac: 'celiac';
          dyslipidemia: 'dyslipidemia';
          pcos: 'pcos';
          kidney_disease: 'kidney_disease';
          other: 'other';
        }>
      >
    >;
    medicalNotes: z.ZodDefault<z.ZodString>;
    allergies: z.ZodDefault<z.ZodArray<z.ZodString>>;
    medications: z.ZodDefault<z.ZodArray<z.ZodString>>;
    activityLevel: z.ZodDefault<
      z.ZodEnum<{
        sedentary: 'sedentary';
        light: 'light';
        moderate: 'moderate';
        active: 'active';
        very_active: 'very_active';
      }>
    >;
    goal: z.ZodEnum<{
      weight_loss: 'weight_loss';
      weight_gain: 'weight_gain';
      maintenance: 'maintenance';
      therapeutic: 'therapeutic';
    }>;
    targetWeightKg: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    statusOverride: z.ZodDefault<
      z.ZodNullable<
        z.ZodEnum<{
          follow_up: 'follow_up';
          new_plan: 'new_plan';
          plan_ended: 'plan_ended';
          inactive: 'inactive';
        }>
      >
    >;
  },
  z.core.$strip
>;
export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientCreateFormValues = z.input<typeof patientCreateSchema>;
export declare const patientUpdateSchema: z.ZodObject<
  {
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<
      z.ZodEnum<{
        male: 'male';
        female: 'female';
      }>
    >;
    birthDate: z.ZodOptional<z.ZodISODate>;
    phone: z.ZodOptional<
      z.ZodPipe<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>, z.ZodString>
    >;
    email: z.ZodOptional<z.ZodUnion<readonly [z.ZodEmail, z.ZodLiteral<''>]>>;
    address: z.ZodOptional<z.ZodString>;
    occupation: z.ZodOptional<z.ZodString>;
    chronicConditions: z.ZodOptional<
      z.ZodArray<
        z.ZodEnum<{
          diabetes_t1: 'diabetes_t1';
          diabetes_t2: 'diabetes_t2';
          hypertension: 'hypertension';
          hypothyroidism: 'hypothyroidism';
          hyperthyroidism: 'hyperthyroidism';
          celiac: 'celiac';
          dyslipidemia: 'dyslipidemia';
          pcos: 'pcos';
          kidney_disease: 'kidney_disease';
          other: 'other';
        }>
      >
    >;
    medicalNotes: z.ZodOptional<z.ZodString>;
    allergies: z.ZodOptional<z.ZodArray<z.ZodString>>;
    medications: z.ZodOptional<z.ZodArray<z.ZodString>>;
    activityLevel: z.ZodOptional<
      z.ZodEnum<{
        sedentary: 'sedentary';
        light: 'light';
        moderate: 'moderate';
        active: 'active';
        very_active: 'very_active';
      }>
    >;
    goal: z.ZodOptional<
      z.ZodEnum<{
        weight_loss: 'weight_loss';
        weight_gain: 'weight_gain';
        maintenance: 'maintenance';
        therapeutic: 'therapeutic';
      }>
    >;
    targetWeightKg: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    statusOverride: z.ZodOptional<
      z.ZodNullable<
        z.ZodEnum<{
          follow_up: 'follow_up';
          new_plan: 'new_plan';
          plan_ended: 'plan_ended';
          inactive: 'inactive';
        }>
      >
    >;
  },
  z.core.$strip
>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
export declare const patientArchiveSchema: z.ZodObject<
  {
    archived: z.ZodBoolean;
  },
  z.core.$strip
>;
export declare const PATIENT_SORT_FIELDS: readonly [
  'fullName',
  'fileNumber',
  'lastVisitDate',
  'createdAt',
];
export type PatientSortField = (typeof PATIENT_SORT_FIELDS)[number];
export declare const patientListQuerySchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<
      z.ZodEnum<{
        follow_up: 'follow_up';
        new_plan: 'new_plan';
        plan_ended: 'plan_ended';
        inactive: 'inactive';
      }>
    >;
    gender: z.ZodOptional<
      z.ZodEnum<{
        male: 'male';
        female: 'female';
      }>
    >;
    goal: z.ZodOptional<
      z.ZodEnum<{
        weight_loss: 'weight_loss';
        weight_gain: 'weight_gain';
        maintenance: 'maintenance';
        therapeutic: 'therapeutic';
      }>
    >;
    archived: z.ZodDefault<
      z.ZodPipe<
        z.ZodEnum<{
          true: 'true';
          false: 'false';
        }>,
        z.ZodTransform<boolean, 'true' | 'false'>
      >
    >;
    sort: z.ZodDefault<
      z.ZodEnum<{
        createdAt: 'createdAt';
        fileNumber: 'fileNumber';
        fullName: 'fullName';
        lastVisitDate: 'lastVisitDate';
      }>
    >;
    dir: z.ZodDefault<
      z.ZodEnum<{
        asc: 'asc';
        desc: 'desc';
      }>
    >;
  },
  z.core.$strip
>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
