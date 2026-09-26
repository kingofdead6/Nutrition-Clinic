import { z } from 'zod';
import { USER_ROLES } from '../enums';
import { baseEntitySchema, toPatchSchema } from './common';

const emailSchema = z.email({ error: 'validation.email' }).trim().toLowerCase();
const passwordSchema = z.string().min(8, { error: 'validation.passwordMin' }).max(128);

/** Public user shape. `passwordHash` exists only inside the server. */
export const userSchema = baseEntitySchema.extend({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  role: z.enum(USER_ROLES),
  isActive: z.boolean(),
});
export type User = z.infer<typeof userSchema>;

export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(USER_ROLES).default('nutritionist'),
  isActive: z.boolean().default(true),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = toPatchSchema(userCreateSchema);
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'validation.required' }),
});
export type LoginInput = z.infer<typeof loginSchema>;
