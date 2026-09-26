import { describe, expect, it } from 'vitest';
import {
  findConflict,
  minutesToTime,
  slotsOverlap,
  startOfWeek,
  timeToMinutes,
  weekdayOf,
  type Slot,
} from './schedule';

const slot = (time: string, durationMin = 30, over: Partial<Slot> = {}): Slot => ({
  date: '2026-09-27',
  time,
  durationMin,
  status: 'confirmed',
  ...over,
});

describe('time helpers', () => {
  it('converts both ways', () => {
    expect(timeToMinutes('08:30')).toBe(510);
    expect(minutesToTime(510)).toBe('08:30');
    expect(minutesToTime(24 * 60 + 5)).toBe('23:59');
  });
});

describe('slotsOverlap', () => {
  it('detects overlaps and allows back-to-back slots', () => {
    expect(slotsOverlap(slot('09:00'), slot('09:15'))).toBe(true);
    expect(slotsOverlap(slot('09:00', 60), slot('09:30'))).toBe(true); // contained
    expect(slotsOverlap(slot('09:00'), slot('09:30'))).toBe(false); // touching
    expect(slotsOverlap(slot('09:30'), slot('09:00'))).toBe(false);
    expect(slotsOverlap(slot('09:00'), slot('09:00', 30, { date: '2026-09-28' }))).toBe(false);
  });
});

describe('findConflict', () => {
  const existing = [
    { ...slot('09:00'), id: 'a' },
    { ...slot('10:00', 30, { status: 'cancelled' }), id: 'b' },
    { ...slot('11:00', 30, { status: 'no_show' }), id: 'c' },
    { ...slot('12:00', 30, { status: 'completed' }), id: 'd' },
  ];

  it('returns the overlapping blocking appointment', () => {
    expect(findConflict(slot('09:10'), existing)?.id).toBe('a');
    expect(findConflict(slot('12:15'), existing)?.id).toBe('d');
  });

  it('cancelled and no-show appointments free their slot', () => {
    expect(findConflict(slot('10:00'), existing)).toBeNull();
    expect(findConflict(slot('11:00'), existing)).toBeNull();
  });

  it('ignores the appointment being edited, and non-blocking candidates', () => {
    expect(findConflict({ ...slot('09:00'), id: 'a' }, existing)).toBeNull();
    expect(findConflict(slot('09:00', 30, { status: 'cancelled' }), existing)).toBeNull();
  });
});

describe('week helpers', () => {
  it('weekdayOf is timezone independent', () => {
    expect(weekdayOf('2026-09-25')).toBe(5); // Friday
    expect(weekdayOf('2026-09-26')).toBe(6); // Saturday
  });

  it('weeks start on Saturday by default', () => {
    expect(startOfWeek('2026-09-25')).toBe('2026-09-19');
    expect(startOfWeek('2026-09-26')).toBe('2026-09-26');
    expect(startOfWeek('2026-09-27', 0)).toBe('2026-09-27'); // Sunday start
  });
});
