// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { z } from 'zod';
import { dateOnlySchema } from './common.js';
/** Optional range; the server defaults to the last 6 months (clinic timezone). */
export const reportRangeQuerySchema = z
  .object({ from: dateOnlySchema.optional(), to: dateOnlySchema.optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    error: 'validation.rangeOrder',
    path: ['to'],
  });
