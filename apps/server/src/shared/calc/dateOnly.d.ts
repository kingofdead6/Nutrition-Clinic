// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/**
 * Arithmetic on `YYYY-MM-DD` values, done in UTC so it never shifts with the host timezone.
 */
/** Whole days from `from` to `to` (negative when `to` is earlier). */
export declare function daysBetween(from: string, to: string): number;
export declare function addDays(date: string, days: number): string;
/** Age in completed years on `today` (both `YYYY-MM-DD`). */
export declare function ageOn(birthDate: string, today: string): number;
