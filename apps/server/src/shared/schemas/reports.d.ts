// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import type { AppointmentStatus, PatientGoal } from '../enums.js';
import type { OutcomeBucket } from '../calc/reports.js';
import type { PatientProgress } from '../calc/progress.js';
import type { Patient } from './patient.js';
/** Optional range; the server defaults to the last 6 months (clinic timezone). */
export declare const reportRangeQuerySchema: z.ZodObject<
  {
    from: z.ZodOptional<z.ZodISODate>;
    to: z.ZodOptional<z.ZodISODate>;
  },
  z.core.$strip
>;
export type ReportRangeQuery = z.infer<typeof reportRangeQuerySchema>;
export interface ReportsOverview {
  from: string;
  to: string;
  totals: {
    newPatients: number;
    /** Distinct patient-days with a measurement or a completed appointment. */
    visits: number;
    /** Patients with at least one visit in the range. */
    patientsSeen: number;
    appointments: number;
    /** completed / (completed + no-show), %, over appointments up to today. */
    attendanceRate: number | null;
  };
  months: Array<{
    month: string;
    newPatients: number;
    visits: number;
  }>;
  appointmentStatus: Record<AppointmentStatus, number>;
  outcomes: {
    /** Patients with ≥2 measurements in the range, by weight change (latest − first). */
    buckets: Record<OutcomeBucket, number>;
    patients: number;
    avgChangeKg: number | null;
    byGoal: Array<{
      goal: PatientGoal;
      patients: number;
      avgChangeKg: number | null;
    }>;
  };
}
export interface PatientReport {
  patient: Patient;
  generatedOn: string;
  progress: PatientProgress;
  stats: {
    visits: number;
    firstVisit: string | null;
    lastVisit: string | null;
    followedDays: number | null;
    weightChangeKg: number | null;
    bmiChange: number | null;
    goalProgressPct: number | null;
    appointments: Record<AppointmentStatus, number>;
    attendanceRate: number | null;
    prescriptions: number;
  };
  plans: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    dailyCalories: number;
    isActive: boolean;
  }>;
}
