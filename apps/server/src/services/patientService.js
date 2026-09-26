import { randomUUID } from 'node:crypto';
import { computePatientStatus, todayIn } from '#shared';
import { fieldError, notFound } from '../lib/errors.js';

/** @typedef {import('#shared').Patient} Patient */

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {{ settings: import('./settingsService.js').SettingsService }} deps
 */
export function createPatientService({ repositories, storage, logger, now }, { settings }) {
  const { patients, measurements, appointments, dietPlans, prescriptions } = repositories;

  async function clinicTimezone() {
    return (await settings.get()).timezone;
  }

  /** @param {string} id */
  async function getOrThrow(id) {
    const patient = await patients.findById(id);
    if (!patient) throw notFound('patient');
    return patient;
  }

  /** @param {string} birthDate @param {string} today */
  function assertBirthDate(birthDate, today) {
    if (birthDate > today) throw fieldError('birthDate', 'validation.futureDate');
  }

  /**
   * @param {Patient} patient
   * @param {{ startDate: string, endDate: string } | null} activePlan
   * @param {string} timezone
   */
  function statusFor(patient, activePlan, timezone) {
    return computePatientStatus({
      archived: patient.archived,
      statusOverride: patient.statusOverride,
      activePlan: activePlan && { startDate: activePlan.startDate, endDate: activePlan.endDate },
      lastVisitDate: patient.lastVisitDate,
      createdDate: todayIn(timezone, new Date(patient.createdAt)),
      today: todayIn(timezone, now()),
    });
  }

  /**
   * Recomputes the derived fields of one patient (last visit from measurements and
   * completed appointments, then status) and saves them if they changed.
   * Called after anything that can affect them: visits, plans, overrides, archiving.
   * @param {string} id
   */
  async function refresh(id) {
    const patient = await getOrThrow(id);
    const [visits, completed, plan, timezone] = await Promise.all([
      measurements.listByPatient(id),
      appointments.findAll({ patientId: id, status: 'completed' }),
      dietPlans.findActiveByPatient(id),
      clinicTimezone(),
    ]);
    const dates = [...visits.map((m) => m.date), ...completed.map((a) => a.date)].sort();
    const lastVisitDate = dates[dates.length - 1] ?? null;
    const status = statusFor({ ...patient, lastVisitDate }, plan, timezone);
    if (lastVisitDate === patient.lastVisitDate && status === patient.status) return patient;
    return /** @type {Patient} */ (await patients.update(id, { lastVisitDate, status }));
  }

  return {
    refresh,

    /** @param {import('#shared').PatientListQuery} q */
    async list(q) {
      const { items, total } = await patients.list(
        {
          search: q.search,
          status: q.status,
          gender: q.gender,
          goal: q.goal,
          archived: q.archived,
        },
        { page: q.page, pageSize: q.pageSize },
        { field: q.sort, dir: q.dir },
      );
      return { data: items, page: q.page, pageSize: q.pageSize, total };
    },

    get: getOrThrow,

    /** @param {import('#shared').PatientCreateInput} input */
    async create(input) {
      const timezone = await clinicTimezone();
      assertBirthDate(input.birthDate, todayIn(timezone, now()));
      const draft = {
        ...input,
        fileNumber: await patients.nextFileNumber(),
        fullName: `${input.firstName} ${input.lastName}`,
        photoPath: null,
        archived: false,
        lastVisitDate: null,
        status: /** @type {import('#shared').PatientStatus} */ ('follow_up'),
      };
      draft.status = statusFor(
        { ...draft, id: '', createdAt: new Date().toISOString(), updatedAt: '' },
        null,
        timezone,
      );
      return patients.create(draft);
    },

    /**
     * @param {string} id
     * @param {import('#shared').PatientUpdateInput} patch
     */
    async update(id, patch) {
      const current = await getOrThrow(id);
      if (patch.birthDate) assertBirthDate(patch.birthDate, todayIn(await clinicTimezone(), now()));
      const firstName = patch.firstName ?? current.firstName;
      const lastName = patch.lastName ?? current.lastName;
      await patients.update(id, { ...patch, fullName: `${firstName} ${lastName}` });
      return refresh(id);
    },

    /** @param {string} id @param {boolean} archived */
    async setArchived(id, archived) {
      await getOrThrow(id);
      await patients.update(id, { archived });
      return refresh(id);
    },

    /**
     * Deletes the patient and everything that belongs to them (visits, appointments,
     * plans, prescriptions, photo).
     * @param {string} id
     */
    async remove(id) {
      const patient = await getOrThrow(id);
      await Promise.all([
        measurements.deleteByPatient(id),
        appointments.deleteByPatient(id),
        dietPlans.deleteByPatient(id),
        prescriptions.deleteByPatient(id),
      ]);
      await patients.delete(id);
      if (patient.photoPath) await storage.delete(patient.photoPath).catch(() => undefined);
    },

    /** @param {string} id @param {{ buffer: Buffer, ext: string }} image */
    async setPhoto(id, image) {
      const patient = await getOrThrow(id);
      const key = `patients/${id}-${randomUUID().slice(0, 8)}.${image.ext}`;
      await storage.save(key, image.buffer);
      const updated = /** @type {Patient} */ (await patients.update(id, { photoPath: key }));
      if (patient.photoPath) {
        await storage
          .delete(patient.photoPath)
          .catch((err) => logger.warn({ err }, 'Could not delete old patient photo'));
      }
      return updated;
    },

    /** @param {string} id */
    async removePhoto(id) {
      const patient = await getOrThrow(id);
      const updated = /** @type {Patient} */ (await patients.update(id, { photoPath: null }));
      if (patient.photoPath) await storage.delete(patient.photoPath);
      return updated;
    },

    /** @param {string} id */
    async photoFile(id) {
      const { photoPath } = await getOrThrow(id);
      if (!photoPath || !(await storage.exists(photoPath))) throw notFound('photo');
      return { key: photoPath, path: storage.getPath(photoPath) };
    },

    /**
     * Recomputes every patient's status: "plan ended" and "inactive" change with the
     * calendar, not just with edits. Runs at startup and periodically.
     * @returns {Promise<number>} how many patients changed
     */
    async refreshAllStatuses() {
      const [all, timezone] = await Promise.all([patients.findAll(), clinicTimezone()]);
      const plans = await dietPlans.findActiveByPatients(all.map((p) => p.id));
      const planByPatient = new Map(plans.map((p) => [p.patientId, p]));
      let changed = 0;
      for (const patient of all) {
        const status = statusFor(patient, planByPatient.get(patient.id) ?? null, timezone);
        if (status !== patient.status) {
          await patients.update(patient.id, { status });
          changed += 1;
        }
      }
      return changed;
    },
  };
}

/** @typedef {ReturnType<typeof createPatientService>} PatientService */
