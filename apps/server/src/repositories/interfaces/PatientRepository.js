import { CRUD_METHODS } from './common.js';

/** @typedef {import('@clinic/shared').Patient} Patient */
/** @typedef {import('@clinic/shared').PatientStatus} PatientStatus */

/**
 * @typedef {object} PatientFilter
 * @property {string} [search]  Matched against the normalized name, phone and file number.
 * @property {PatientStatus} [status]
 * @property {import('@clinic/shared').Gender} [gender]
 * @property {import('@clinic/shared').PatientGoal} [goal]
 * @property {boolean} [archived]
 */

/**
 * @typedef {import('./common.js').CrudRepository<Patient> & {
 *   list(
 *     filter: PatientFilter,
 *     page: import('./common.js').PageRequest,
 *     sort: import('./common.js').SortRequest<import('@clinic/shared').PatientSortField>,
 *   ): Promise<import('./common.js').ListResult<Patient>>,
 *   findAll(filter?: PatientFilter): Promise<Patient[]>,
 *   nextFileNumber(): Promise<string>,
 *   countByStatus(filter?: Pick<PatientFilter, 'archived'>): Promise<Record<PatientStatus, number>>,
 *   countCreatedBetween(fromIso: string, toIso: string): Promise<number>,
 * }} PatientRepository
 *
 * - `findAll`: unpaginated filter, for service-level computations (status sweep, stats).
 * - `nextFileNumber`: atomically reserves the next sequential number: P-0001, P-0002, …
 * - `countCreatedBetween`: patients whose createdAt falls in [fromIso, toIso).
 */

export const PATIENT_REPOSITORY_METHODS = Object.freeze([
  ...CRUD_METHODS,
  'list',
  'findAll',
  'nextFileNumber',
  'countByStatus',
  'countCreatedBetween',
]);
