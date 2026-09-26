import { CRUD_METHODS } from './common.js';

/** @typedef {import('#shared').PrescriptionTemplate} PrescriptionTemplate */

/**
 * @typedef {import('./common.js').CrudRepository<PrescriptionTemplate> & {
 *   listAll(): Promise<PrescriptionTemplate[]>,
 * }} PrescriptionTemplateRepository
 *
 * - `listAll`: ordered by name.
 */

export const PRESCRIPTION_TEMPLATE_REPOSITORY_METHODS = Object.freeze([...CRUD_METHODS, 'listAll']);
