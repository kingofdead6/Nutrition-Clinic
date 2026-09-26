import { CRUD_METHODS } from './common.js';

/** @typedef {import('#shared').Appointment} Appointment */
/** @typedef {import('#shared').AppointmentStatus} AppointmentStatus */

/**
 * @typedef {object} AppointmentFilter
 * @property {string} [from]  Inclusive, YYYY-MM-DD.
 * @property {string} [to]  Inclusive, YYYY-MM-DD.
 * @property {AppointmentStatus} [status]
 * @property {readonly AppointmentStatus[]} [statuses]
 * @property {string} [patientId]
 */

/**
 * @typedef {import('./common.js').CrudRepository<Appointment> & {
 *   list(
 *     filter: AppointmentFilter,
 *     page: import('./common.js').PageRequest,
 *   ): Promise<import('./common.js').ListResult<Appointment>>,
 *   findAll(filter: AppointmentFilter): Promise<Appointment[]>,
 *   findUpcoming(
 *     from: { date: string, time: string },
 *     statuses: readonly AppointmentStatus[],
 *     limit: number,
 *   ): Promise<Appointment[]>,
 *   deleteByPatient(patientId: string): Promise<number>,
 * }} AppointmentRepository
 *
 * - `list` / `findAll`: ordered by date then time ascending.
 * - `findUpcoming`: at or after (date, time), ascending, limited; statuses passed explicitly.
 */

export const APPOINTMENT_REPOSITORY_METHODS = Object.freeze([
  ...CRUD_METHODS,
  'list',
  'findAll',
  'findUpcoming',
  'deleteByPatient',
]);
