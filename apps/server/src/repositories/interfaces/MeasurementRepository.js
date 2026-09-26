import { CRUD_METHODS } from './common.js';

/** @typedef {import('@clinic/shared').Measurement} Measurement */

/**
 * @typedef {import('./common.js').CrudRepository<Measurement> & {
 *   listByPatient(patientId: string): Promise<Measurement[]>,
 *   listByPatients(patientIds: readonly string[]): Promise<Measurement[]>,
 *   listBetween(from: string, to: string): Promise<Measurement[]>,
 *   deleteByPatient(patientId: string): Promise<number>,
 * }} MeasurementRepository
 *
 * - `listByPatient`: date ascending (oldest first), ties by createdAt.
 * - `listByPatients`: ordered by patientId then date ascending.
 * - `listBetween`: date in [from, to], inclusive, YYYY-MM-DD.
 */

export const MEASUREMENT_REPOSITORY_METHODS = Object.freeze([
  ...CRUD_METHODS,
  'listByPatient',
  'listByPatients',
  'listBetween',
  'deleteByPatient',
]);
