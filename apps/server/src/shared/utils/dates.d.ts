// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/**
 * Clock helpers that work in the clinic's timezone rather than the host's, so "today"
 * and "now" are the same on the server, the client and a desktop machine set to UTC.
 */
/** Today's date in `timeZone` as `YYYY-MM-DD`. */
export declare function todayIn(timeZone: string, now?: Date): string;
/** Current wall-clock time in `timeZone` as `HH:mm`. */
export declare function nowTimeIn(timeZone: string, now?: Date): string;
/** `YYYY-MM-DD` → `YYYY/MM/DD` (the display format), without timezone conversions. */
export declare function formatDateOnly(date: string | null | undefined): string;
