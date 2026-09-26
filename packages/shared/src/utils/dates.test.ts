import { describe, expect, it } from 'vitest';
import { formatDateOnly, nowTimeIn, todayIn } from './dates';

describe('clinic clock', () => {
  // 2026-09-25 23:30 UTC is already the 26th at 00:30 in Algiers (UTC+1).
  const lateUtc = new Date('2026-09-25T23:30:00Z');

  it('computes today in the clinic timezone, not UTC', () => {
    expect(todayIn('Africa/Algiers', lateUtc)).toBe('2026-09-26');
    expect(todayIn('UTC', lateUtc)).toBe('2026-09-25');
  });

  it('computes the wall-clock time', () => {
    expect(nowTimeIn('Africa/Algiers', lateUtc)).toBe('00:30');
  });

  it('formats date-only values for display', () => {
    expect(formatDateOnly('2026-09-25')).toBe('2026/09/25');
    expect(formatDateOnly(null)).toBe('—');
  });
});
