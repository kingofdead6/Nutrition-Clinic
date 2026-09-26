// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
export declare const workingDaySchema: z.ZodObject<
  {
    day: z.ZodEnum<{
      sun: 'sun';
      mon: 'mon';
      tue: 'tue';
      wed: 'wed';
      thu: 'thu';
      fri: 'fri';
      sat: 'sat';
    }>;
    isOpen: z.ZodBoolean;
    open: z.ZodString;
    close: z.ZodString;
  },
  z.core.$strip
>;
export type WorkingDay = z.infer<typeof workingDaySchema>;
/** Singleton record. */
export declare const clinicSettingsSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    lastBackupAt: z.ZodDefault<z.ZodNullable<z.ZodISODateTime>>;
    clinicName: z.ZodDefault<z.ZodString>;
    tagline: z.ZodDefault<z.ZodString>;
    logoPath: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    address: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    practitionerName: z.ZodDefault<z.ZodString>;
    practitionerTitle: z.ZodDefault<z.ZodString>;
    defaultAppointmentDurationMin: z.ZodDefault<z.ZodNumber>;
    workingHours: z.ZodDefault<
      z.ZodArray<
        z.ZodObject<
          {
            day: z.ZodEnum<{
              sun: 'sun';
              mon: 'mon';
              tue: 'tue';
              wed: 'wed';
              thu: 'thu';
              fri: 'fri';
              sat: 'sat';
            }>;
            isOpen: z.ZodBoolean;
            open: z.ZodString;
            close: z.ZodString;
          },
          z.core.$strip
        >
      >
    >;
    printFooterText: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<
      z.ZodEnum<{
        ar: 'ar';
        fr: 'fr';
      }>
    >;
    timezone: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type ClinicSettings = z.infer<typeof clinicSettingsSchema>;
/** Editable fields with defaults applied (logo is uploaded separately). Used for first-run defaults. */
export declare const clinicSettingsInputSchema: z.ZodObject<
  {
    clinicName: z.ZodDefault<z.ZodString>;
    tagline: z.ZodDefault<z.ZodString>;
    address: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodString>;
    practitionerName: z.ZodDefault<z.ZodString>;
    practitionerTitle: z.ZodDefault<z.ZodString>;
    defaultAppointmentDurationMin: z.ZodDefault<z.ZodNumber>;
    workingHours: z.ZodDefault<
      z.ZodArray<
        z.ZodObject<
          {
            day: z.ZodEnum<{
              sun: 'sun';
              mon: 'mon';
              tue: 'tue';
              wed: 'wed';
              thu: 'thu';
              fri: 'fri';
              sat: 'sat';
            }>;
            isOpen: z.ZodBoolean;
            open: z.ZodString;
            close: z.ZodString;
          },
          z.core.$strip
        >
      >
    >;
    printFooterText: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<
      z.ZodEnum<{
        ar: 'ar';
        fr: 'fr';
      }>
    >;
    timezone: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type ClinicSettingsInput = z.infer<typeof clinicSettingsInputSchema>;
/** PUT /settings body: any subset of the editable fields, no defaults injected. */
export declare const clinicSettingsUpdateSchema: z.ZodObject<
  {
    clinicName: z.ZodOptional<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    practitionerName: z.ZodOptional<z.ZodString>;
    practitionerTitle: z.ZodOptional<z.ZodString>;
    defaultAppointmentDurationMin: z.ZodOptional<z.ZodNumber>;
    workingHours: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            day: z.ZodEnum<{
              sun: 'sun';
              mon: 'mon';
              tue: 'tue';
              wed: 'wed';
              thu: 'thu';
              fri: 'fri';
              sat: 'sat';
            }>;
            isOpen: z.ZodBoolean;
            open: z.ZodString;
            close: z.ZodString;
          },
          z.core.$strip
        >
      >
    >;
    printFooterText: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<
      z.ZodEnum<{
        ar: 'ar';
        fr: 'fr';
      }>
    >;
    timezone: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
export type ClinicSettingsUpdateInput = z.infer<typeof clinicSettingsUpdateSchema>;
/** GET/PUT /settings response: the record plus a cache-busted logo URL (relative to the API base). */
export type ClinicSettingsResponse = ClinicSettings & {
  logoUrl: string | null;
};
