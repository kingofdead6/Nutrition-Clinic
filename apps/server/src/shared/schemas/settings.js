// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import { LOCALES, WEEKDAYS } from '../enums.js';
import { DEFAULT_SETTINGS } from '../constants.js';
import {
  baseEntitySchema,
  isoDateTimeSchema,
  optionalText,
  timeSchema,
  toPatchSchema,
} from './common.js';
export const workingDaySchema = z
  .object({
    day: z.enum(WEEKDAYS),
    isOpen: z.boolean(),
    open: timeSchema,
    close: timeSchema,
  })
  .refine((d) => !d.isOpen || d.open < d.close, {
    error: 'validation.closeAfterOpen',
    path: ['close'],
  });
const settingsFields = {
  clinicName: z.string().trim().min(1).max(120).default(DEFAULT_SETTINGS.clinicName),
  tagline: z.string().trim().max(200).default(DEFAULT_SETTINGS.tagline),
  logoPath: z.string().nullable().default(null),
  address: optionalText(300),
  phone: optionalText(40),
  email: optionalText(120),
  practitionerName: optionalText(120),
  practitionerTitle: z.string().trim().max(120).default(DEFAULT_SETTINGS.practitionerTitle),
  defaultAppointmentDurationMin: z.number().int().min(5).max(240).default(30),
  workingHours: z.array(workingDaySchema).default(DEFAULT_SETTINGS.workingHours),
  printFooterText: optionalText(500),
  locale: z.enum(LOCALES).default('ar'),
  /** IANA zone used to decide what "today" is (appointments, status computation). */
  timezone: z.string().default(DEFAULT_SETTINGS.timezone),
};
/** Singleton record. */
export const clinicSettingsSchema = baseEntitySchema.extend({
  ...settingsFields,
  lastBackupAt: isoDateTimeSchema.nullable().default(null),
});
/** Editable fields with defaults applied (logo is uploaded separately). Used for first-run defaults. */
export const clinicSettingsInputSchema = z.object(settingsFields).omit({ logoPath: true });
/** PUT /settings body: any subset of the editable fields, no defaults injected. */
export const clinicSettingsUpdateSchema = toPatchSchema(clinicSettingsInputSchema);
