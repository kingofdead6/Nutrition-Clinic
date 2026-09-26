import { timeToMinutes, weekdayKeyOf, type WorkingDay } from '@shared';

export const workingDayOf = (hours: readonly WorkingDay[] | undefined, date: string) =>
  hours?.find((d) => d.day === weekdayKeyOf(date));

/** 'closed' | 'outside' | null — a soft warning only; booking is still allowed. */
export function hoursWarning(
  hours: readonly WorkingDay[] | undefined,
  date: string,
  time: string,
  durationMin: number,
): 'closed' | 'outside' | null {
  if (!hours || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const day = workingDayOf(hours, date);
  if (!day) return null;
  if (!day.isOpen) return 'closed';
  const start = timeToMinutes(time);
  return start < timeToMinutes(day.open) || start + durationMin > timeToMinutes(day.close)
    ? 'outside'
    : null;
}

/** Visible hour range of the calendar: the widest open–close span, 08:00–17:00 by default. */
export function calendarRange(hours: readonly WorkingDay[] | undefined): {
  startMin: number;
  endMin: number;
} {
  const open = hours?.filter((d) => d.isOpen) ?? [];
  if (open.length === 0) return { startMin: 8 * 60, endMin: 17 * 60 };
  const start = Math.min(...open.map((d) => timeToMinutes(d.open)));
  const end = Math.max(...open.map((d) => timeToMinutes(d.close)));
  return { startMin: Math.floor(start / 60) * 60, endMin: Math.ceil(end / 60) * 60 };
}
