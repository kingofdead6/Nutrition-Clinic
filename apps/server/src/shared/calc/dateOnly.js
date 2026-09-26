// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/**
 * Arithmetic on `YYYY-MM-DD` values, done in UTC so it never shifts with the host timezone.
 */
const parse = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y ?? NaN, (m ?? NaN) - 1, d ?? NaN);
};
const DAY_MS = 86_400_000;
/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from, to) {
  return Math.round((parse(to) - parse(from)) / DAY_MS);
}
export function addDays(date, days) {
  return new Date(parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}
/** Age in completed years on `today` (both `YYYY-MM-DD`). */
export function ageOn(birthDate, today) {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return Math.max(0, age);
}
