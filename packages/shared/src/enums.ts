/**
 * Enumerations shared by client and server. Labels live in the client's i18n
 * files under `enums.<name>.<value>`; these arrays are the source of truth for values.
 */

export const USER_ROLES = ['admin', 'nutritionist', 'assistant'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LOCALES = ['ar', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const PATIENT_GOALS = ['weight_loss', 'weight_gain', 'maintenance', 'therapeutic'] as const;
export type PatientGoal = (typeof PATIENT_GOALS)[number];

export const PATIENT_STATUSES = ['follow_up', 'new_plan', 'plan_ended', 'inactive'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

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
] as const;
export type ChronicCondition = (typeof CHRONIC_CONDITIONS)[number];

export const BMI_CATEGORIES = [
  'underweight',
  'normal',
  'overweight',
  'obese_1',
  'obese_2',
  'obese_3',
] as const;
export type BmiCategory = (typeof BMI_CATEGORIES)[number];

export const APPOINTMENT_TYPES = ['follow_up', 'new_consultation', 'measurement_only'] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Appointments still expected to happen (shown as "upcoming"). */
export const UPCOMING_STATUSES: readonly AppointmentStatus[] = ['pending', 'confirmed'];

/** Statuses that occupy a time slot for double-booking checks. */
export const BLOCKING_APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  'pending',
  'confirmed',
  'completed',
];

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
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const SERVING_UNITS = ['g', 'ml', 'piece', 'cup', 'tbsp'] as const;
export type ServingUnit = (typeof SERVING_UNITS)[number];

/** The spec's "breakfast / snack / lunch / snack / dinner" with the two snacks made distinct. */
export const MEAL_TYPES = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** A diet-plan day is either the single "daily" template or a specific weekday. */
export const PLAN_DAY_KEYS = ['daily', ...WEEKDAYS] as const;
export type PlanDayKey = (typeof PLAN_DAY_KEYS)[number];

export const PRESCRIPTION_TYPES = [
  'weight_loss',
  'balanced',
  'diabetic',
  'weight_gain',
  'custom',
] as const;
export type PrescriptionType = (typeof PRESCRIPTION_TYPES)[number];

export const DB_DRIVERS = ['mongo', 'sqlite'] as const;
export type DbDriver = (typeof DB_DRIVERS)[number];
