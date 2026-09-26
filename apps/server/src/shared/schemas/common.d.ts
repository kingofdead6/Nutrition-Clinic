// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
/**
 * Custom validation messages are i18n keys (`validation.*`). The client translates
 * them; built-in zod issues are translated from their issue code.
 */
export declare const idSchema: z.ZodUUID;
/** Date-only value stored and transported as `YYYY-MM-DD`. */
export declare const dateOnlySchema: z.ZodISODate;
/** Wall-clock time `HH:mm` (24h). */
export declare const timeSchema: z.ZodString;
/** Full timestamp as an ISO-8601 string (UTC). */
export declare const isoDateTimeSchema: z.ZodISODateTime;
/** Algerian numbers: mobile 05/06/07 + 8 digits, landline 0 + 8 digits, optionally +213. */
export declare const phoneSchema: z.ZodPipe<
  z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>,
  z.ZodString
>;
export declare const optionalText: (max?: number) => z.ZodDefault<z.ZodString>;
export declare const baseEntitySchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
  },
  z.core.$strip
>;
export type BaseEntity = z.infer<typeof baseEntitySchema>;
/** Keys that the server assigns; never accepted from the client. */
export declare const SYSTEM_FIELDS: {
  readonly id: true;
  readonly createdAt: true;
  readonly updatedAt: true;
};
export declare const paginationQuerySchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
export declare const sortDirSchema: z.ZodEnum<{
  asc: 'asc';
  desc: 'desc';
}>;
export type SortDir = z.infer<typeof sortDirSchema>;
export declare const idParamsSchema: z.ZodObject<
  {
    id: z.ZodUUID;
  },
  z.core.$strip
>;
export declare const ERROR_CODES: readonly [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'NOT_IMPLEMENTED',
  'INTERNAL_ERROR',
];
export type ErrorCode = (typeof ERROR_CODES)[number];
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}
export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  dbDriver: string;
  db: 'up' | 'down';
  time: string;
}
type StripDefault<F> = F extends z.ZodDefault<infer Inner> ? Inner : F;
/**
 * Builds a PATCH-style schema: every field optional and **without defaults**.
 * Needed because zod 4's `.partial()` still applies field defaults, so a partial update
 * `{ clinicName }` would otherwise reset every other field to its default.
 */
export declare function toPatchSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<StripDefault<T[K]>> }>;
/** GET /dashboard/stats */
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  /** Mean kg lost (first − latest) over weight-loss patients with ≥2 visits who lost weight; null if none. */
  avgWeightLossKg: number | null;
  /** Mean kg gained over weight-gain patients with ≥2 visits who gained weight; null if none. */
  avgWeightGainKg: number | null;
  /** How many patients each average is based on. */
  weightLossPatients: number;
  weightGainPatients: number;
  patientsByStatus: Record<'follow_up' | 'new_plan' | 'plan_ended' | 'inactive', number>;
  newPatientsThisMonth: number;
  today: string;
}
export {};
