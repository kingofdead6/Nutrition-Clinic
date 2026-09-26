import type { PatientGoal } from '../enums';
import { roundTo } from './health';

/** Every `YYYY-MM` from the month of `from` to the month of `to`, inclusive. */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = from.slice(0, 7).split('-').map(Number) as [number, number];
  const [ty, tm] = to.slice(0, 7).split('-').map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** First day of the month `monthsBack` months before `date`'s month (`YYYY-MM-01`). */
export function monthStart(date: string, monthsBack = 0): string {
  let [y, m] = date.slice(0, 7).split('-').map(Number) as [number, number];
  m -= monthsBack;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

/**
 * Weight-change buckets (kg, latest − first) — a diverging scale around "stable".
 * Ordered from most lost to most gained.
 */
export const OUTCOME_BUCKETS = [
  'lost5',
  'lost3',
  'lost1',
  'stable',
  'gained1',
  'gained3',
  'gained5',
] as const;
export type OutcomeBucket = (typeof OUTCOME_BUCKETS)[number];

/** |change| < 1 kg is "stable"; bucket edges are inclusive on the larger side (−3 → lost3). */
export function outcomeBucket(changeKg: number): OutcomeBucket {
  if (changeKg <= -5) return 'lost5';
  if (changeKg <= -3) return 'lost3';
  if (changeKg <= -1) return 'lost1';
  if (changeKg < 1) return 'stable';
  if (changeKg < 3) return 'gained1';
  if (changeKg < 5) return 'gained3';
  return 'gained5';
}

/**
 * Share of the way from the starting weight to the target (0–100, rounded), or null
 * when there is no target / the goal is not about weight / start already equals target.
 * Moving away from the target gives 0.
 */
export function goalProgressPct(input: {
  goal: PatientGoal;
  startKg: number | null | undefined;
  currentKg: number | null | undefined;
  targetKg: number | null | undefined;
}): number | null {
  const { goal, startKg, currentKg, targetKg } = input;
  if (startKg == null || currentKg == null || targetKg == null) return null;
  if (goal !== 'weight_loss' && goal !== 'weight_gain') return null;
  const needed = targetKg - startKg;
  if (
    needed === 0 ||
    (goal === 'weight_loss' && needed > 0) ||
    (goal === 'weight_gain' && needed < 0)
  )
    return null;
  const pct = ((currentKg - startKg) / needed) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

/** Completed / (completed + no-show), as a percentage with 1 decimal; null with no data. */
export function attendanceRate(completed: number, noShow: number): number | null {
  const total = completed + noShow;
  return total === 0 ? null : roundTo((completed / total) * 100, 1);
}
