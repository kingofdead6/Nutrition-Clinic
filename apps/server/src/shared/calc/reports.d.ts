// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import type { PatientGoal } from '../enums.js';
/** Every `YYYY-MM` from the month of `from` to the month of `to`, inclusive. */
export declare function monthsBetween(from: string, to: string): string[];
/** First day of the month `monthsBack` months before `date`'s month (`YYYY-MM-01`). */
export declare function monthStart(date: string, monthsBack?: number): string;
/**
 * Weight-change buckets (kg, latest − first) — a diverging scale around "stable".
 * Ordered from most lost to most gained.
 */
export declare const OUTCOME_BUCKETS: readonly [
  'lost5',
  'lost3',
  'lost1',
  'stable',
  'gained1',
  'gained3',
  'gained5',
];
export type OutcomeBucket = (typeof OUTCOME_BUCKETS)[number];
/** |change| < 1 kg is "stable"; bucket edges are inclusive on the larger side (−3 → lost3). */
export declare function outcomeBucket(changeKg: number): OutcomeBucket;
/**
 * Share of the way from the starting weight to the target (0–100, rounded), or null
 * when there is no target / the goal is not about weight / start already equals target.
 * Moving away from the target gives 0.
 */
export declare function goalProgressPct(input: {
  goal: PatientGoal;
  startKg: number | null | undefined;
  currentKg: number | null | undefined;
  targetKg: number | null | undefined;
}): number | null;
/** Completed / (completed + no-show), as a percentage with 1 decimal; null with no data. */
export declare function attendanceRate(completed: number, noShow: number): number | null;
