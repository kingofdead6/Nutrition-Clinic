// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
import type { BmiCategory } from '../enums.js';
/** Rounds half away from zero, so a loss and a gain of the same size round alike (±1.75 → ±1.8). */
declare const round: (value: number, decimals: number) => number;
/** Body-mass index = weight / height², rounded to 1 decimal. */
export declare function computeBmi(weightKg: number, heightM: number): number;
/** WHO adult classification. */
export declare function bmiCategory(bmi: number): BmiCategory;
/** Waist-to-hip ratio rounded to 2 decimals, or null when either is missing. */
export declare function computeWaistHipRatio(
  waistCm: number | null | undefined,
  hipCm: number | null | undefined,
): number | null;
/** Every derived value of a measurement. The server stores these; clients never send them. */
export declare function deriveMeasurement(m: {
  weightKg: number;
  heightM: number;
  waistCm?: number | null;
  hipCm?: number | null;
}): {
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese_1' | 'obese_2' | 'obese_3';
  waistHipRatio: number | null;
};
export { round as roundTo };
