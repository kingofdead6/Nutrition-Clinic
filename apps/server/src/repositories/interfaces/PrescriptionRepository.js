import { CRUD_METHODS } from './common.js';

/** @typedef {import('@clinic/shared').Prescription} Prescription */

/**
 * @typedef {import('./common.js').CrudRepository<Prescription> & {
 *   listByPatient(patientId: string): Promise<Prescription[]>,
 *   deleteByPatient(patientId: string): Promise<number>,
 * }} PrescriptionRepository
 *
 * - `listByPatient`: date descending, then createdAt descending.
 */

export const PRESCRIPTION_REPOSITORY_METHODS = Object.freeze([
  ...CRUD_METHODS,
  'listByPatient',
  'deleteByPatient',
]);
