// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/** Rounds half away from zero, so a loss and a gain of the same size round alike (±1.75 → ±1.8). */
const round = (value, decimals) => {
  const f = 10 ** decimals;
  const r = Math.round((Math.abs(value) + Number.EPSILON) * f) / f;
  return value < 0 ? -r : r;
};
/** Body-mass index = weight / height², rounded to 1 decimal. */
export function computeBmi(weightKg, heightM) {
  if (!(weightKg > 0) || !(heightM > 0)) throw new RangeError('weight and height must be positive');
  return round(weightKg / (heightM * heightM), 1);
}
/** WHO adult classification. */
export function bmiCategory(bmi) {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese_1';
  if (bmi < 40) return 'obese_2';
  return 'obese_3';
}
/** Waist-to-hip ratio rounded to 2 decimals, or null when either is missing. */
export function computeWaistHipRatio(waistCm, hipCm) {
  if (waistCm == null || hipCm == null || !(waistCm > 0) || !(hipCm > 0)) return null;
  return round(waistCm / hipCm, 2);
}
/** Every derived value of a measurement. The server stores these; clients never send them. */
export function deriveMeasurement(m) {
  const bmi = computeBmi(m.weightKg, m.heightM);
  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    waistHipRatio: computeWaistHipRatio(m.waistCm, m.hipCm),
  };
}
export { round as roundTo };
