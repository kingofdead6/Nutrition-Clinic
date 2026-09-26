import { APPOINTMENT_REPOSITORY_METHODS } from './AppointmentRepository.js';
import { DIET_PLAN_REPOSITORY_METHODS } from './DietPlanRepository.js';
import { FOOD_REPOSITORY_METHODS } from './FoodRepository.js';
import { MEASUREMENT_REPOSITORY_METHODS } from './MeasurementRepository.js';
import { PATIENT_REPOSITORY_METHODS } from './PatientRepository.js';
import { PRESCRIPTION_REPOSITORY_METHODS } from './PrescriptionRepository.js';
import { PRESCRIPTION_TEMPLATE_REPOSITORY_METHODS } from './PrescriptionTemplateRepository.js';
import { SETTINGS_REPOSITORY_METHODS } from './SettingsRepository.js';
import { USER_REPOSITORY_METHODS } from './UserRepository.js';

/**
 * Driver-level operations that are not tied to an aggregate.
 * @typedef {object} DatabaseHandle
 * @property {import('@clinic/shared').DbDriver} driver
 * @property {() => Promise<boolean>} ping
 * @property {() => Promise<void>} close
 */

/**
 * Everything services and routes may depend on. Nothing else touches the database.
 * @typedef {object} Repositories
 * @property {import('./UserRepository.js').UserRepository} users
 * @property {import('./SettingsRepository.js').SettingsRepository} settings
 * @property {import('./PatientRepository.js').PatientRepository} patients
 * @property {import('./MeasurementRepository.js').MeasurementRepository} measurements
 * @property {import('./AppointmentRepository.js').AppointmentRepository} appointments
 * @property {import('./FoodRepository.js').FoodRepository} foods
 * @property {import('./DietPlanRepository.js').DietPlanRepository} dietPlans
 * @property {import('./PrescriptionRepository.js').PrescriptionRepository} prescriptions
 * @property {import('./PrescriptionTemplateRepository.js').PrescriptionTemplateRepository} prescriptionTemplates
 * @property {DatabaseHandle} db
 */

/** The method names every driver must implement, per repository. */
export const REPOSITORY_CONTRACT = Object.freeze({
  users: USER_REPOSITORY_METHODS,
  settings: SETTINGS_REPOSITORY_METHODS,
  patients: PATIENT_REPOSITORY_METHODS,
  measurements: MEASUREMENT_REPOSITORY_METHODS,
  appointments: APPOINTMENT_REPOSITORY_METHODS,
  foods: FOOD_REPOSITORY_METHODS,
  dietPlans: DIET_PLAN_REPOSITORY_METHODS,
  prescriptions: PRESCRIPTION_REPOSITORY_METHODS,
  prescriptionTemplates: PRESCRIPTION_TEMPLATE_REPOSITORY_METHODS,
  db: Object.freeze(['ping', 'close']),
});

/**
 * Throws if a driver's repository set is missing any method of the contract, so an
 * incomplete driver fails at startup instead of mid-request.
 * @param {Record<string, unknown>} repos
 * @returns {Repositories}
 */
export function assertRepositories(repos) {
  /** @type {string[]} */
  const missing = [];
  for (const [name, methods] of Object.entries(REPOSITORY_CONTRACT)) {
    const repo = /** @type {Record<string, unknown> | undefined} */ (repos[name]);
    for (const method of methods) {
      if (typeof repo?.[method] !== 'function') missing.push(`${name}.${method}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Repository driver is incomplete; missing: ${missing.join(', ')}`);
  }
  return /** @type {Repositories} */ (/** @type {unknown} */ (repos));
}
