import { z } from 'zod';
import type { Locale } from '../enums';
import { clinicSettingsInputSchema } from './settings';
import { userSchema, type User } from './user';

const emailSchema = z.email({ error: 'validation.email' }).trim().toLowerCase();
const newPasswordSchema = z.string().min(8, { error: 'validation.passwordMin' }).max(128);

/** POST /auth/setup: first run only. Creates the admin account and the clinic settings. */
export const setupSchema = z.object({
  admin: z.object({
    name: z.string().trim().min(1, { error: 'validation.required' }).max(120),
    email: emailSchema,
    password: newPasswordSchema,
  }),
  clinic: clinicSettingsInputSchema.pick({
    clinicName: true,
    tagline: true,
    practitionerName: true,
    practitionerTitle: true,
    phone: true,
    address: true,
  }),
});
export type SetupInput = z.infer<typeof setupSchema>;
export type SetupFormValues = z.input<typeof setupSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, { error: 'validation.required' }).max(120),
  email: emailSchema,
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'validation.required' }),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    error: 'validation.passwordMismatch',
    path: ['confirmPassword'],
  });
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

export const authUserSchema = userSchema;
export interface MeResponse {
  user: User;
}
