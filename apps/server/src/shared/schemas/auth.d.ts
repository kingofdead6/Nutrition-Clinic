// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import type { Locale } from '../enums.js';
import { type User } from './user.js';
/** POST /auth/setup: first run only. Creates the admin account and the clinic settings. */
export declare const setupSchema: z.ZodObject<
  {
    admin: z.ZodObject<
      {
        name: z.ZodString;
        email: z.ZodEmail;
        password: z.ZodString;
      },
      z.core.$strip
    >;
    clinic: z.ZodObject<
      {
        clinicName: z.ZodDefault<z.ZodString>;
        tagline: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        practitionerName: z.ZodDefault<z.ZodString>;
        practitionerTitle: z.ZodDefault<z.ZodString>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export type SetupInput = z.infer<typeof setupSchema>;
export type SetupFormValues = z.input<typeof setupSchema>;
export declare const profileUpdateSchema: z.ZodObject<
  {
    name: z.ZodString;
    email: z.ZodEmail;
  },
  z.core.$strip
>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export declare const passwordChangeSchema: z.ZodObject<
  {
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
  },
  z.core.$strip
>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
/** GET /auth/status: public, used by the login/setup screens before anyone is signed in. */
export interface AuthStatus {
  setupRequired: boolean;
  clinic: {
    clinicName: string;
    tagline: string;
    practitionerTitle: string;
    timezone: string;
    locale: Locale;
    /** Cache-busted URL of the uploaded logo, or null to use the bundled default. */
    logoUrl: string | null;
  };
}
export declare const authUserSchema: z.ZodObject<
  {
    id: z.ZodUUID;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    name: z.ZodString;
    email: z.ZodEmail;
    role: z.ZodEnum<{
      admin: 'admin';
      nutritionist: 'nutritionist';
      assistant: 'assistant';
    }>;
    isActive: z.ZodBoolean;
  },
  z.core.$strip
>;
export interface MeResponse {
  user: User;
}
