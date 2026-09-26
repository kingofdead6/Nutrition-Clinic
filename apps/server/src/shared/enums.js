// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/**
 * Enumerations shared by client and server. Labels live in the client's i18n
 * files under `enums.<name>.<value>`; these arrays are the source of truth for values.
 */
export const USER_ROLES = ['admin', 'nutritionist', 'assistant'];
export const LOCALES = ['ar', 'fr'];
export const GENDERS = ['male', 'female'];
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
export const PATIENT_GOALS = ['weight_loss', 'weight_gain', 'maintenance', 'therapeutic'];
export const PATIENT_STATUSES = ['follow_up', 'new_plan', 'plan_ended', 'inactive'];
/** Empty array means "no chronic condition". */
export const CHRONIC_CONDITIONS = [
  'diabetes_t1',
  'diabetes_t2',
  'hypertension',
  'hypothyroidism',
  'hyperthyroidism',
  'celiac',
  'dyslipidemia',
  'pcos',
  'kidney_disease',
  'other',
];
export const BMI_CATEGORIES = [
  'underweight',
  'normal',
  'overweight',
  'obese_1',
  'obese_2',
  'obese_3',
];
export const APPOINTMENT_TYPES = ['follow_up', 'new_consultation', 'measurement_only'];
export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
/** Appointments still expected to happen (shown as "upcoming"). */
export const UPCOMING_STATUSES = ['pending', 'confirmed'];
/** Statuses that occupy a time slot for double-booking checks. */
export const BLOCKING_APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed'];
export const FOOD_CATEGORIES = [
  'grains',
  'proteins',
  'dairy',
  'fruits',
  'vegetables',
  'fats',
  'sweets',
  'drinks',
  'traditional',
];
export const SERVING_UNITS = ['g', 'ml', 'piece', 'cup', 'tbsp'];
/** The spec's "breakfast / snack / lunch / snack / dinner" with the two snacks made distinct. */
export const MEAL_TYPES = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'];
export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/** A diet-plan day is either the single "daily" template or a specific weekday. */
export const PLAN_DAY_KEYS = ['daily', ...WEEKDAYS];
export const PRESCRIPTION_TYPES = ['weight_loss', 'balanced', 'diabetic', 'weight_gain', 'custom'];
export const DB_DRIVERS = ['mongo', 'sqlite'];
