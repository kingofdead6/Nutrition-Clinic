/**
 * Clock helpers that work in the clinic's timezone rather than the host's, so "today"
 * and "now" are the same on the server, the client and a desktop machine set to UTC.
 */

function partsIn(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** Today's date in `timeZone` as `YYYY-MM-DD`. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  const p = partsIn(timeZone, now);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Current wall-clock time in `timeZone` as `HH:mm`. */
export function nowTimeIn(timeZone: string, now: Date = new Date()): string {
  const p = partsIn(timeZone, now);
  return `${p.hour}:${p.minute}`;
}

/** `YYYY-MM-DD` → `YYYY/MM/DD` (the display format), without timezone conversions. */
export function formatDateOnly(date: string | null | undefined): string {
  return date ? date.replaceAll('-', '/') : '—';
}
