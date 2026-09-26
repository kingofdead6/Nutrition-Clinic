// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
export declare const appointmentSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    patientId: z.ZodUUID;
    date: z.ZodISODate;
    time: z.ZodString;
    durationMin: z.ZodDefault<z.ZodNumber>;
    type: z.ZodDefault<
      z.ZodEnum<{
        follow_up: 'follow_up';
        new_consultation: 'new_consultation';
        measurement_only: 'measurement_only';
      }>
    >;
    status: z.ZodDefault<
      z.ZodEnum<{
        pending: 'pending';
        confirmed: 'confirmed';
        completed: 'completed';
        cancelled: 'cancelled';
        no_show: 'no_show';
      }>
    >;
    notes: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type Appointment = z.infer<typeof appointmentSchema>;
export declare const appointmentCreateSchema: z.ZodObject<
  {
    patientId: z.ZodUUID;
    date: z.ZodISODate;
    time: z.ZodString;
    durationMin: z.ZodDefault<z.ZodNumber>;
    type: z.ZodDefault<
      z.ZodEnum<{
        follow_up: 'follow_up';
        new_consultation: 'new_consultation';
        measurement_only: 'measurement_only';
      }>
    >;
    status: z.ZodDefault<
      z.ZodEnum<{
        pending: 'pending';
        confirmed: 'confirmed';
        completed: 'completed';
        cancelled: 'cancelled';
        no_show: 'no_show';
      }>
    >;
    notes: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentFormValues = z.input<typeof appointmentCreateSchema>;
export declare const appointmentUpdateSchema: z.ZodObject<
  {
    patientId: z.ZodOptional<z.ZodUUID>;
    date: z.ZodOptional<z.ZodISODate>;
    time: z.ZodOptional<z.ZodString>;
    durationMin: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<
      z.ZodEnum<{
        follow_up: 'follow_up';
        new_consultation: 'new_consultation';
        measurement_only: 'measurement_only';
      }>
    >;
    status: z.ZodOptional<
      z.ZodEnum<{
        pending: 'pending';
        confirmed: 'confirmed';
        completed: 'completed';
        cancelled: 'cancelled';
        no_show: 'no_show';
      }>
    >;
    notes: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
export declare const appointmentStatusUpdateSchema: z.ZodObject<
  {
    status: z.ZodEnum<{
      pending: 'pending';
      confirmed: 'confirmed';
      completed: 'completed';
      cancelled: 'cancelled';
      no_show: 'no_show';
    }>;
  },
  z.core.$strip
>;
export declare const upcomingQuerySchema: z.ZodObject<
  {
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
>;
export declare const appointmentListQuerySchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    from: z.ZodOptional<z.ZodISODate>;
    to: z.ZodOptional<z.ZodISODate>;
    status: z.ZodOptional<
      z.ZodEnum<{
        pending: 'pending';
        confirmed: 'confirmed';
        completed: 'completed';
        cancelled: 'cancelled';
        no_show: 'no_show';
      }>
    >;
    patientId: z.ZodOptional<z.ZodUUID>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
/** Appointment joined with the patient fields the lists need (joined in the service layer). */
export interface AppointmentWithPatient extends Appointment {
  patient: {
    id: string;
    fullName: string;
    fileNumber: string;
    phone: string;
  } | null;
}
/** Returned in `details` of a 409 when a slot is already taken. */
export interface AppointmentConflictDetails {
  appointmentId: string;
  date: string;
  time: string;
  durationMin: number;
  patientName: string | null;
}
