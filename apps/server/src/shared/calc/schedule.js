// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { BLOCKING_APPOINTMENT_STATUSES, WEEKDAYS } from '../enums.js';
import { addDays } from './dateOnly.js';
/** `HH:mm` → minutes since midnight. */
export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
/** Minutes since midnight → `HH:mm` (clamped to the day). */
export function minutesToTime(minutes) {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
/** Half-open intervals [start, start + duration) on the same date overlap. Touching is fine. */
export function slotsOverlap(a, b) {
  if (a.date !== b.date) return false;
  const aStart = timeToMinutes(a.time);
  const bStart = timeToMinutes(b.time);
  return aStart < bStart + b.durationMin && bStart < aStart + a.durationMin;
}
export const isBlocking = (status) => BLOCKING_APPOINTMENT_STATUSES.includes(status);
/**
 * The first existing appointment that would double-book `candidate`, or null.
 * Cancelled / no-show appointments free their slot; the candidate itself (same id) is ignored.
 */
export function findConflict(candidate, existing) {
  if (!isBlocking(candidate.status)) return null;
  return (
    existing.find(
      (e) => e.id !== candidate.id && isBlocking(e.status) && slotsOverlap(candidate, e),
    ) ?? null
  );
}
/** Day of week of a `YYYY-MM-DD` date: 0 = Sunday … 6 = Saturday (timezone-independent). */
export function weekdayOf(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}
/** Weekday key (`sun` … `sat`) of a `YYYY-MM-DD` date. */
export function weekdayKeyOf(date) {
  return WEEKDAYS[weekdayOf(date)];
}
/** First day of the week containing `date`. Algerian calendars start on Saturday (6). */
export function startOfWeek(date, weekStartsOn = 6) {
  return addDays(date, -((weekdayOf(date) - weekStartsOn + 7) % 7));
}
