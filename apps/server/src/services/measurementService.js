import { buildProgress, deriveMeasurement, todayIn } from '@clinic/shared';
import { fieldError, notFound } from '../lib/errors.js';

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {{
 *   settings: import('./settingsService.js').SettingsService,
 *   patients: import('./patientService.js').PatientService,
 * }} deps
 */
export function createMeasurementService({ repositories, now }, { settings, patients }) {
  const repo = repositories.measurements;

  /** @param {string} date */
  async function assertNotFuture(date) {
    if (date > todayIn((await settings.get()).timezone, now())) {
      throw fieldError('date', 'validation.futureDate');
    }
  }

  /** @param {string} patientId @param {string} measurementId */
  async function getOwned(patientId, measurementId) {
    const m = await repo.findById(measurementId);
    if (!m || m.patientId !== patientId) throw notFound('measurement');
    return m;
  }

  return {
    /** @param {string} patientId */
    async list(patientId) {
      await patients.get(patientId);
      return repo.listByPatient(patientId);
    },

    /**
     * @param {string} patientId
     * @param {import('@clinic/shared').MeasurementCreateInput} input
     */
    async create(patientId, input) {
      await patients.get(patientId);
      await assertNotFuture(input.date);
      // Derived values are always computed here, never taken from the client.
      const created = await repo.create({ ...input, patientId, ...deriveMeasurement(input) });
      await patients.refresh(patientId);
      return created;
    },

    /**
     * @param {string} patientId
     * @param {string} measurementId
     * @param {import('@clinic/shared').MeasurementUpdateInput} patch
     */
    async update(patientId, measurementId, patch) {
      const current = await getOwned(patientId, measurementId);
      if (patch.date) await assertNotFuture(patch.date);
      const merged = { ...current, ...patch };
      const updated = await repo.update(measurementId, { ...patch, ...deriveMeasurement(merged) });
      await patients.refresh(patientId);
      return updated;
    },

    /** @param {string} patientId @param {string} measurementId */
    async remove(patientId, measurementId) {
      await getOwned(patientId, measurementId);
      await repo.delete(measurementId);
      await patients.refresh(patientId);
    },

    /** @param {string} patientId */
    async progress(patientId) {
      await patients.get(patientId);
      return buildProgress(await repo.listByPatient(patientId));
    },
  };
}

/** @typedef {ReturnType<typeof createMeasurementService>} MeasurementService */
