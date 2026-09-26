import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { clinicSettingsUpdateSchema } from './settings';
import { toPatchSchema } from './common';
import { userUpdateSchema } from './user';

describe('toPatchSchema', () => {
  const base = z.object({
    a: z.string().default('A'),
    b: z.number().min(1).default(1),
    c: z.array(z.string()).default([]),
  });

  it('never injects defaults for missing fields', () => {
    expect(toPatchSchema(base).parse({ a: 'x' })).toEqual({ a: 'x' });
    expect(toPatchSchema(base).parse({})).toEqual({});
  });

  it('still validates provided fields', () => {
    expect(() => toPatchSchema(base).parse({ b: 0 })).toThrow();
  });

  it('protects real update schemas (regression: partial() reset role/isActive)', () => {
    expect(userUpdateSchema.parse({ name: 'X' })).toEqual({ name: 'X' });
    expect(clinicSettingsUpdateSchema.parse({ clinicName: 'C' })).toEqual({ clinicName: 'C' });
  });
});
