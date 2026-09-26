// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import { roundTo } from './health.js';
export const PROGRESS_METRICS = ['weightKg', 'bmi', 'waistCm', 'hipCm', 'bodyFatPct'];
/**
 * Chart series + starting/current/total change. For each metric, "start" and
 * "current" are the first and last visits where that metric was recorded.
 */
export function buildProgress(measurements) {
  const series = [...measurements]
    .sort((a, b) =>
      a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date),
    )
    .map((m) => ({
      date: m.date,
      weightKg: m.weightKg,
      bmi: m.bmi,
      waistCm: m.waistCm,
      hipCm: m.hipCm,
      bodyFatPct: m.bodyFatPct,
    }));
  const change = {};
  for (const metric of PROGRESS_METRICS) {
    const values = series.map((p) => p[metric]).filter((v) => v != null);
    const first = values[0];
    const last = values[values.length - 1];
    change[metric] =
      first != null && last != null && values.length >= 2 ? roundTo(last - first, 1) : null;
  }
  return {
    series,
    start: series[0] ?? null,
    current: series[series.length - 1] ?? null,
    change,
    visits: series.length,
  };
}
