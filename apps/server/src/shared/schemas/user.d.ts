// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
/** Public user shape. `passwordHash` exists only inside the server. */
export declare const userSchema: z.ZodObject<
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
export type User = z.infer<typeof userSchema>;
export declare const userCreateSchema: z.ZodObject<
  {
    name: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    role: z.ZodDefault<
      z.ZodEnum<{
        admin: 'admin';
        nutritionist: 'nutritionist';
        assistant: 'assistant';
      }>
    >;
    isActive: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strip
>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export declare const userUpdateSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEmail>;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<
      z.ZodEnum<{
        admin: 'admin';
        nutritionist: 'nutritionist';
        assistant: 'assistant';
      }>
    >;
    isActive: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export declare const loginSchema: z.ZodObject<
  {
    email: z.ZodEmail;
    password: z.ZodString;
  },
  z.core.$strip
>;
export type LoginInput = z.infer<typeof loginSchema>;
