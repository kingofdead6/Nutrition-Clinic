// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/**
 * Enumerations shared by client and server. Labels live in the client's i18n
 * files under `enums.<name>.<value>`; these arrays are the source of truth for values.
 */
export declare const USER_ROLES: readonly ['admin', 'nutritionist', 'assistant'];
export type UserRole = (typeof USER_ROLES)[number];
export declare const LOCALES: readonly ['ar', 'fr'];
export type Locale = (typeof LOCALES)[number];
export declare const GENDERS: readonly ['male', 'female'];
export type Gender = (typeof GENDERS)[number];
export declare const ACTIVITY_LEVELS: readonly [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export declare const PATIENT_GOALS: readonly [
  'weight_loss',
  'weight_gain',
  'maintenance',
  'therapeutic',
];
export type PatientGoal = (typeof PATIENT_GOALS)[number];
export declare const PATIENT_STATUSES: readonly ['follow_up', 'new_plan', 'plan_ended', 'inactive'];
export type PatientStatus = (typeof PATIENT_STATUSES)[number];
/** Empty array means "no chronic condition". */
export declare const CHRONIC_CONDITIONS: readonly [
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
export type ChronicCondition = (typeof CHRONIC_CONDITIONS)[number];
export declare const BMI_CATEGORIES: readonly [
  'underweight',
  'normal',
  'overweight',
  'obese_1',
  'obese_2',
  'obese_3',
];
export type BmiCategory = (typeof BMI_CATEGORIES)[number];
export declare const APPOINTMENT_TYPES: readonly [
  'follow_up',
  'new_consultation',
  'measurement_only',
];
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];
export declare const APPOINTMENT_STATUSES: readonly [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
];
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
/** Appointments still expected to happen (shown as "upcoming"). */
export declare const UPCOMING_STATUSES: readonly AppointmentStatus[];
/** Statuses that occupy a time slot for double-booking checks. */
export declare const BLOCKING_APPOINTMENT_STATUSES: readonly AppointmentStatus[];
export declare const FOOD_CATEGORIES: readonly [
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
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];
export declare const SERVING_UNITS: readonly ['g', 'ml', 'piece', 'cup', 'tbsp'];
export type ServingUnit = (typeof SERVING_UNITS)[number];
/** The spec's "breakfast / snack / lunch / snack / dinner" with the two snacks made distinct. */
export declare const MEAL_TYPES: readonly [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
];
export type MealType = (typeof MEAL_TYPES)[number];
export declare const WEEKDAYS: readonly ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export type Weekday = (typeof WEEKDAYS)[number];
/** A diet-plan day is either the single "daily" template or a specific weekday. */
export declare const PLAN_DAY_KEYS: readonly [
  'daily',
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];
export type PlanDayKey = (typeof PLAN_DAY_KEYS)[number];
export declare const PRESCRIPTION_TYPES: readonly [
  'weight_loss',
  'balanced',
  'diabetic',
  'weight_gain',
  'custom',
];
export type PrescriptionType = (typeof PRESCRIPTION_TYPES)[number];
export declare const DB_DRIVERS: readonly ['mongo', 'sqlite'];
export type DbDriver = (typeof DB_DRIVERS)[number];
