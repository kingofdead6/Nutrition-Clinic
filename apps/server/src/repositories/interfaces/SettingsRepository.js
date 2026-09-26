/** @typedef {import('@clinic/shared').ClinicSettings} ClinicSettings */

/**
 * Singleton clinic settings record.
 * @typedef {object} SettingsRepository
 * @property {() => Promise<ClinicSettings | null>} get
 * @property {(data: Partial<import('./common.js').NewEntity<ClinicSettings>>) => Promise<ClinicSettings>} upsert
 *   Creates the record if missing, otherwise merges `data` into it.
 * @property {() => Promise<ClinicSettings[]>} exportAll
 * @property {(records: readonly ClinicSettings[]) => Promise<void>} importAll
 */

export const SETTINGS_REPOSITORY_METHODS = Object.freeze([
  'get',
  'upsert',
  'exportAll',
  'importAll',
]);
