// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from '../enums.js';
import {
  baseEntitySchema,
  dateOnlySchema,
  idSchema,
  optionalText,
  paginationQuerySchema,
  timeSchema,
  toPatchSchema,
} from './common.js';
const appointmentInputFields = {
  patientId: idSchema,
  date: dateOnlySchema,
  time: timeSchema,
  durationMin: z.number().int().min(5).max(240).default(30),
  type: z.enum(APPOINTMENT_TYPES).default('follow_up'),
  status: z.enum(APPOINTMENT_STATUSES).default('pending'),
  notes: optionalText(2000),
};
export const appointmentSchema = baseEntitySchema.extend(appointmentInputFields);
export const appointmentCreateSchema = z.object(appointmentInputFields);
export const appointmentUpdateSchema = toPatchSchema(appointmentCreateSchema);
export const appointmentStatusUpdateSchema = z.object({ status: z.enum(APPOINTMENT_STATUSES) });
export const upcomingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});
export const appointmentListQuerySchema = paginationQuerySchema.extend({
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  patientId: idSchema.optional(),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});
