// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { type AppointmentStatus, type Weekday } from '../enums.js';
/** `HH:mm` → minutes since midnight. */
export declare function timeToMinutes(time: string): number;
/** Minutes since midnight → `HH:mm` (clamped to the day). */
export declare function minutesToTime(minutes: number): string;
export interface Slot {
  id?: string;
  date: string;
  time: string;
  durationMin: number;
  status: AppointmentStatus;
}
/** Half-open intervals [start, start + duration) on the same date overlap. Touching is fine. */
export declare function slotsOverlap(a: Slot, b: Slot): boolean;
export declare const isBlocking: (status: AppointmentStatus) => boolean;
/**
 * The first existing appointment that would double-book `candidate`, or null.
 * Cancelled / no-show appointments free their slot; the candidate itself (same id) is ignored.
 */
export declare function findConflict<T extends Slot>(
  candidate: Slot,
  existing: readonly T[],
): T | null;
/** Day of week of a `YYYY-MM-DD` date: 0 = Sunday … 6 = Saturday (timezone-independent). */
export declare function weekdayOf(date: string): number;
/** Weekday key (`sun` … `sat`) of a `YYYY-MM-DD` date. */
export declare function weekdayKeyOf(date: string): Weekday;
/** First day of the week containing `date`. Algerian calendars start on Saturday (6). */
export declare function startOfWeek(date: string, weekStartsOn?: number): string;
