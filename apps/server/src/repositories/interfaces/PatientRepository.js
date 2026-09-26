import { CRUD_METHODS } from './common.js';

/** @typedef {import('#shared').Patient} Patient */
/** @typedef {import('#shared').PatientStatus} PatientStatus */

/**
 * @typedef {object} PatientFilter
 * @property {string} [search]  Matched against the normalized name, phone and file number.
 * @property {PatientStatus} [status]
 * @property {import('#shared').Gender} [gender]
 * @property {import('#shared').PatientGoal} [goal]
 * @property {boolean} [archived]
 */

/**
 * @typedef {import('./common.js').CrudRepository<Patient> & {
 *   list(
 *     filter: PatientFilter,
 *     page: import('./common.js').PageRequest,
 *     sort: import('./common.js').SortRequest<import('#shared').PatientSortField>,
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
