// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import { clinicSettingsInputSchema } from './settings.js';
import { userSchema } from './user.js';
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
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, { error: 'validation.required' }).max(120),
  email: emailSchema,
});
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
export const authUserSchema = userSchema;
