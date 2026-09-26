// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
/**
 * Custom validation messages are i18n keys (`validation.*`). The client translates
 * them; built-in zod issues are translated from their issue code.
 */
export const idSchema = z.uuid({ error: 'validation.id' });
/** Date-only value stored and transported as `YYYY-MM-DD`. */
export const dateOnlySchema = z.iso.date({ error: 'validation.date' });
/** Wall-clock time `HH:mm` (24h). */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'validation.time' });
/** Full timestamp as an ISO-8601 string (UTC). */
export const isoDateTimeSchema = z.iso.datetime({ offset: true, error: 'validation.dateTime' });
/** Algerian numbers: mobile 05/06/07 + 8 digits, landline 0 + 8 digits, optionally +213. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.-]/g, ''))
  .pipe(z.string().regex(/^(\+213|0)\d{8,9}$/, { error: 'validation.phone' }));
export const optionalText = (max = 2000) => z.string().trim().max(max).default('');
export const baseEntitySchema = z.object({
  id: idSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
/** Keys that the server assigns; never accepted from the client. */
export const SYSTEM_FIELDS = { id: true, createdAt: true, updatedAt: true };
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});
export const sortDirSchema = z.enum(['asc', 'desc']);
export const idParamsSchema = z.object({ id: idSchema });
export const ERROR_CODES = [
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
/**
 * Builds a PATCH-style schema: every field optional and **without defaults**.
 * Needed because zod 4's `.partial()` still applies field defaults, so a partial update
 * `{ clinicName }` would otherwise reset every other field to its default.
 */
export function toPatchSchema(schema) {
  const shape = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    let inner = field;
    while (inner instanceof z.ZodDefault) inner = inner.unwrap();
    shape[key] = inner.optional();
  }
  return z.object(shape);
}
