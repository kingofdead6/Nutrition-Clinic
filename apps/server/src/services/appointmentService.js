import { findConflict, nowTimeIn, todayIn, UPCOMING_STATUSES } from '#shared';
import { AppError, conflict, notFound } from '../lib/errors.js';

/** @typedef {import('#shared').Appointment} Appointment */
/** @typedef {import('#shared').AppointmentWithPatient} AppointmentWithPatient */

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {{
 *   settings: import('./settingsService.js').SettingsService,
 *   patients: import('./patientService.js').PatientService,
 * }} deps
 */
export function createAppointmentService({ repositories, now }, { settings, patients }) {
  const repo = repositories.appointments;

  async function clock() {
    const tz = (await settings.get()).timezone;
    const at = now();
    return { today: todayIn(tz, at), now: nowTimeIn(tz, at) };
  }

  /**
   * Adds the patient summary the lists show (joined here, in the service layer, so no
   * driver needs joins).
   * @param {Appointment[]} list
   * @returns {Promise<AppointmentWithPatient[]>}
   */
  async function withPatients(list) {
    const ids = [...new Set(list.map((a) => a.patientId))];
    const found = await repositories.patients.findByIds(ids);
    const byId = new Map(found.map((p) => [p.id, p]));
    return list.map((a) => {
      const p = byId.get(a.patientId);
      return {
        ...a,
        patient: p
          ? { id: p.id, fullName: p.fullName, fileNumber: p.fileNumber, phone: p.phone }
          : null,
      };
    });
  }

  /** @param {string} id */
  async function getOrThrow(id) {
    const a = await repo.findById(id);
    if (!a) throw notFound('appointment');
    return a;
  }

  /**
   * Refuses double-booking: any pending/confirmed/completed appointment overlapping the
   * slot on the same day (cancelled and no-show free the slot).
   * @param {Pick<Appointment, 'date' | 'time' | 'durationMin' | 'status'> & { id?: string }} candidate
   */
  async function assertFree(candidate) {
    const sameDay = await repo.findAll({ from: candidate.date, to: candidate.date });
    const clash = findConflict(candidate, sameDay);
    if (!clash) return;
    const [joined] = await withPatients([clash]);
    /** @type {import('#shared').AppointmentConflictDetails} */
    const details = {
      appointmentId: clash.id,
      date: clash.date,
      time: clash.time,
      durationMin: clash.durationMin,
      patientName: joined?.patient?.fullName ?? null,
    };
    throw conflict('errors.appointmentConflict', details);
  }

  /** @param {string} patientId */
  async function assertPatient(patientId) {
    const patient = await repositories.patients.findById(patientId);
    if (!patient)
      throw new AppError('VALIDATION_ERROR', 'errors.validation', [
        { path: 'patientId', code: 'custom', message: 'errors.notFound.patient' },
      ]);
    return patient;
  }

  return {
    /** @param {import('#shared').AppointmentListQuery} q */
    async list(q) {
      const { items, total } = await repo.list(
        { from: q.from, to: q.to, status: q.status, patientId: q.patientId },
        { page: q.page, pageSize: q.pageSize },
      );
      return { data: await withPatients(items), page: q.page, pageSize: q.pageSize, total };
    },

    async today() {
      const { today } = await clock();
      return withPatients(await repo.findAll({ from: today, to: today }));
    },

    /** Next pending/confirmed appointments from now on. @param {number} limit */
    async upcoming(limit) {
      const { today, now } = await clock();
      return withPatients(
        await repo.findUpcoming({ date: today, time: now }, UPCOMING_STATUSES, limit),
      );
    },

    /** @param {string} id */
    async get(id) {
      const [joined] = await withPatients([await getOrThrow(id)]);
      return joined;
    },

    /** @param {import('#shared').AppointmentCreateInput} input */
    async create(input) {
      await assertPatient(input.patientId);
      await assertFree(input);
      const created = await repo.create(input);
      if (created.status === 'completed') await patients.refresh(created.patientId);
      return this.get(created.id);
    },

    /**
     * @param {string} id
     * @param {import('#shared').AppointmentUpdateInput} patch
     */
    async update(id, patch) {
      const current = await getOrThrow(id);
      if (patch.patientId && patch.patientId !== current.patientId)
        await assertPatient(patch.patientId);
      const next = { ...current, ...patch };
      const slotChanged = ['date', 'time', 'durationMin', 'status'].some(
        (k) => patch[/** @type {keyof typeof patch} */ (k)] !== undefined,
      );
      if (slotChanged) await assertFree(next);
      await repo.update(id, patch);
      // A completed appointment counts as a visit: keep last-visit dates (and status) right.
      await patients.refresh(next.patientId);
      if (next.patientId !== current.patientId) await patients.refresh(current.patientId);
      return this.get(id);
    },

    /** @param {string} id @param {import('#shared').AppointmentStatus} status */
    setStatus(id, status) {
      return this.update(id, { status });
    },

    /** @param {string} id */
    async remove(id) {
      const current = await getOrThrow(id);
      await repo.delete(id);
      await patients.refresh(current.patientId).catch(() => undefined);
    },
  };
}

/** @typedef {ReturnType<typeof createAppointmentService>} AppointmentService */
