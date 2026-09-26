import { CRUD_METHODS } from './common.js';

/** @typedef {import('#shared').DietPlan} DietPlan */

/**
 * @typedef {object} DietPlanFilter
 * @property {string} [patientId]
 * @property {boolean} [isActive]
 * @property {boolean} [isTemplate]
 */

/**
 * @typedef {import('./common.js').CrudRepository<DietPlan> & {
 *   list(
 *     filter: DietPlanFilter,
 *     page: import('./common.js').PageRequest,
 *   ): Promise<import('./common.js').ListResult<DietPlan>>,
 *   listByPatient(patientId: string): Promise<DietPlan[]>,
 *   findActiveByPatient(patientId: string): Promise<DietPlan | null>,
 *   findActiveByPatients(patientIds: readonly string[]): Promise<DietPlan[]>,
 *   activate(planId: string): Promise<DietPlan | null>,
 *   deleteByPatient(patientId: string): Promise<number>,
 * }} DietPlanRepository
 *
 * - `list` / `listByPatient`: startDate descending.
 * - `findActiveByPatients`: at most one per patient.
 * - `activate`: makes `planId` the patient's only active plan (deactivating any other).
 *   Each driver guarantees the one-active-plan invariant its own way.
 */

export const DIET_PLAN_REPOSITORY_METHODS = Object.freeze([
  ...CRUD_METHODS,
  'list',
  'listByPatient',
  'findActiveByPatient',
  'findActiveByPatients',
  'activate',
  'deleteByPatient',
]);
