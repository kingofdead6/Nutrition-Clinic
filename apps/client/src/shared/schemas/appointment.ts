import { z } from 'zod';
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES } from '../enums';
import {
  baseEntitySchema,
  dateOnlySchema,
  idSchema,
  optionalText,
  paginationQuerySchema,
  timeSchema,
  toPatchSchema,
} from './common';

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
export type Appointment = z.infer<typeof appointmentSchema>;

export const appointmentCreateSchema = z.object(appointmentInputFields);
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentFormValues = z.input<typeof appointmentCreateSchema>;

export const appointmentUpdateSchema = toPatchSchema(appointmentCreateSchema);
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;

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
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;

/** Appointment joined with the patient fields the lists need (joined in the service layer). */
export interface AppointmentWithPatient extends Appointment {
  patient: { id: string; fullName: string; fileNumber: string; phone: string } | null;
}

/** Returned in `details` of a 409 when a slot is already taken. */
export interface AppointmentConflictDetails {
  appointmentId: string;
  date: string;
  time: string;
  durationMin: number;
  patientName: string | null;
}
