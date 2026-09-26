import { PATIENT_STATUSES, roundTo, todayIn } from '#shared';

/**
 * Dashboard figures, computed in the service layer from plain repository reads so every
 * storage driver gets them for free (no aggregation pipelines).
 * @param {import('../context.js').AppContext} ctx
 * @param {{ settings: import('./settingsService.js').SettingsService }} deps
 */
export function createDashboardService({ repositories, now }, { settings }) {
  /**
   * Mean change first → latest over patients with ≥2 visits, counting only changes in
   * the goal's direction (the spec: "only positive losses").
   * @param {Map<string, number[]>} weightsByPatient  weights oldest → newest
   * @param {string[]} patientIds
   * @param {1 | -1} direction  -1 = loss, 1 = gain
   */
  function averageChange(weightsByPatient, patientIds, direction) {
    const changes = [];
    for (const id of patientIds) {
      const w = weightsByPatient.get(id);
      if (!w || w.length < 2) continue;
      const delta =
        /** @type {number} */ (w[w.length - 1] - /** @type {number} */ (w[0])) * direction;
      if (delta > 0) changes.push(delta);
    }
    const avg = changes.length
      ? roundTo(changes.reduce((a, b) => a + b, 0) / changes.length, 1)
      : null;
    return { avg, count: changes.length };
  }

  return {
    /** @returns {Promise<import('#shared').DashboardStats>} */
    async stats() {
      const tz = (await settings.get()).timezone;
      const today = todayIn(tz, now());
      const month = today.slice(0, 7);

      const [patients, todays] = await Promise.all([
        repositories.patients.findAll({ archived: false }),
        repositories.appointments.findAll({ from: today, to: today }),
      ]);

      const loss = patients.filter((p) => p.goal === 'weight_loss').map((p) => p.id);
      const gain = patients.filter((p) => p.goal === 'weight_gain').map((p) => p.id);
      const measurements = await repositories.measurements.listByPatients([...loss, ...gain]);
      /** @type {Map<string, number[]>} */
      const weights = new Map();
      for (const m of measurements) {
        const list = weights.get(m.patientId) ?? [];
        list.push(m.weightKg);
        weights.set(m.patientId, list);
      }
      const lost = averageChange(weights, loss, -1);
      const gained = averageChange(weights, gain, 1);

      const byStatus = /** @type {Record<import('#shared').PatientStatus, number>} */ (
        Object.fromEntries(PATIENT_STATUSES.map((s) => [s, 0]))
      );
      for (const p of patients) byStatus[p.status] += 1;

      return {
        totalPatients: patients.length,
        todayAppointments: todays.filter((a) => a.status !== 'cancelled').length,
        avgWeightLossKg: lost.avg,
        avgWeightGainKg: gained.avg,
        weightLossPatients: lost.count,
        weightGainPatients: gained.count,
        patientsByStatus: byStatus,
        // "This month" in the clinic's timezone, not UTC.
        newPatientsThisMonth: patients.filter((p) =>
          todayIn(tz, new Date(p.createdAt)).startsWith(month),
        ).length,
        today,
      };
    },
  };
}

/** @typedef {ReturnType<typeof createDashboardService>} DashboardService */
