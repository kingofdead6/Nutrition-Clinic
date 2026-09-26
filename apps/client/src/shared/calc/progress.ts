import type { Measurement } from '../schemas/measurement';
import { roundTo } from './health';

export const PROGRESS_METRICS = ['weightKg', 'bmi', 'waistCm', 'hipCm', 'bodyFatPct'] as const;
export type ProgressMetric = (typeof PROGRESS_METRICS)[number];

export interface ProgressPoint {
  date: string;
  weightKg: number;
  bmi: number;
  waistCm: number | null;
  hipCm: number | null;
  bodyFatPct: number | null;
}

export interface PatientProgress {
  /** One point per visit, oldest first. */
  series: ProgressPoint[];
  start: ProgressPoint | null;
  current: ProgressPoint | null;
  /** current − start per metric (null when either side lacks the value). */
  change: Record<ProgressMetric, number | null>;
  visits: number;
}

/**
 * Chart series + starting/current/total change. For each metric, "start" and
 * "current" are the first and last visits where that metric was recorded.
 */
export function buildProgress(measurements: readonly Measurement[]): PatientProgress {
  const series = [...measurements]
    .sort((a, b) =>
      a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date),
    )
    .map<ProgressPoint>((m) => ({
      date: m.date,
      weightKg: m.weightKg,
      bmi: m.bmi,
      waistCm: m.waistCm,
      hipCm: m.hipCm,
      bodyFatPct: m.bodyFatPct,
    }));

  const change = {} as Record<ProgressMetric, number | null>;
  for (const metric of PROGRESS_METRICS) {
    const values = series.map((p) => p[metric]).filter((v): v is number => v != null);
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
