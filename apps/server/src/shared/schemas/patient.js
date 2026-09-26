// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import {
  ACTIVITY_LEVELS,
  CHRONIC_CONDITIONS,
  GENDERS,
  PATIENT_GOALS,
  PATIENT_STATUSES,
} from '../enums.js';
import {
  baseEntitySchema,
  dateOnlySchema,
  optionalText,
  paginationQuerySchema,
  phoneSchema,
  sortDirSchema,
  toPatchSchema,
} from './common.js';
const stringList = z.array(z.string().trim().min(1).max(120)).max(50).default([]);
/** Fields the user edits on the patient form. */
const patientInputFields = {
  firstName: z.string().trim().min(1, { error: 'validation.required' }).max(60),
  lastName: z.string().trim().min(1, { error: 'validation.required' }).max(60),
  gender: z.enum(GENDERS),
  birthDate: dateOnlySchema,
  phone: phoneSchema,
  email: z.union([z.email({ error: 'validation.email' }), z.literal('')]).default(''),
  address: optionalText(300),
  occupation: optionalText(120),
  chronicConditions: z.array(z.enum(CHRONIC_CONDITIONS)).default([]),
  medicalNotes: optionalText(4000),
  allergies: stringList,
  medications: stringList,
  activityLevel: z.enum(ACTIVITY_LEVELS).default('sedentary'),
  goal: z.enum(PATIENT_GOALS),
  targetWeightKg: z.number().min(20).max(350).nullable().default(null),
  /** Manual override of the computed status; null = automatic. */
  statusOverride: z.enum(PATIENT_STATUSES).nullable().default(null),
};
export const patientSchema = baseEntitySchema.extend({
  ...patientInputFields,
  /** Server-assigned, sequential: P-0001. */
  fileNumber: z.string(),
  /** Derived: `${firstName} ${lastName}`. */
  fullName: z.string(),
  photoPath: z.string().nullable(),
  /** Effective status (override if set, else computed). Maintained by the server. */
  status: z.enum(PATIENT_STATUSES),
  archived: z.boolean(),
  /** Derived from measurements / completed appointments. Maintained by the server. */
  lastVisitDate: dateOnlySchema.nullable(),
});
export const patientCreateSchema = z.object(patientInputFields);
export const patientUpdateSchema = toPatchSchema(patientCreateSchema);
export const patientArchiveSchema = z.object({ archived: z.boolean() });
export const PATIENT_SORT_FIELDS = ['fullName', 'fileNumber', 'lastVisitDate', 'createdAt'];
const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');
export const patientListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  status: z.enum(PATIENT_STATUSES).optional(),
  gender: z.enum(GENDERS).optional(),
  goal: z.enum(PATIENT_GOALS).optional(),
  archived: booleanQuery.default(false),
  sort: z.enum(PATIENT_SORT_FIELDS).default('lastVisitDate'),
  dir: sortDirSchema.default('desc'),
});
