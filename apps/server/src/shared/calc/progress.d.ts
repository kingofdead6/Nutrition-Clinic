// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import type { Measurement } from '../schemas/measurement.js';
export declare const PROGRESS_METRICS: readonly [
  'weightKg',
  'bmi',
  'waistCm',
  'hipCm',
  'bodyFatPct',
];
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
export declare function buildProgress(measurements: readonly Measurement[]): PatientProgress;
