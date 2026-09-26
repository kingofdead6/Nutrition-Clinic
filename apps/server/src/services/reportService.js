import {
  APPOINTMENT_STATUSES,
  attendanceRate,
  buildProgress,
  daysBetween,
  goalProgressPct,
  monthsBetween,
  monthStart,
  OUTCOME_BUCKETS,
  outcomeBucket,
  PATIENT_GOALS,
  roundTo,
  todayIn,
} from '@clinic/shared';
import { notFound } from '../lib/errors.js';

/** @typedef {import('@clinic/shared').AppointmentStatus} AppointmentStatus */

const zeroStatuses = () =>
  /** @type {Record<AppointmentStatus, number>} */ (
    Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]))
  );

/** @param {number[]} values */
const mean = (values) =>
  values.length ? roundTo(values.reduce((a, b) => a + b, 0) / values.length, 1) : null;

/**
 * Clinic and patient reports, computed in the service layer from plain repository reads
 * (no aggregation pipelines), so every storage driver gets them for free.
 * @param {import('../context.js').AppContext} ctx
 * @param {{ settings: import('./settingsService.js').SettingsService }} deps
 */
export function createReportService({ repositories, now }, { settings }) {
  async function clock() {
    const tz = (await settings.get()).timezone;
    return { tz, today: todayIn(tz, now()) };
  }

  return {
    /**
     * @param {import('@clinic/shared').ReportRangeQuery} q
     * @returns {Promise<import('@clinic/shared').ReportsOverview>}
     */
    async overview(q) {
      const { tz, today } = await clock();
      const to = q.to ?? today;
      const from = q.from ?? monthStart(to, 5); // default: the last 6 months

      const [patients, measurements, appointments] = await Promise.all([
        repositories.patients.findAll(),
        repositories.measurements.listBetween(from, to),
        repositories.appointments.findAll({ from, to }),
      ]);
      const months = monthsBetween(from, to);
      const byMonth = new Map(months.map((m) => [m, { month: m, newPatients: 0, visits: 0 }]));

      // New patients (registration date in the clinic's timezone).
      let newPatients = 0;
      for (const p of patients) {
        const created = todayIn(tz, new Date(p.createdAt));
        if (created < from || created > to) continue;
        newPatients += 1;
        const row = byMonth.get(created.slice(0, 7));
        if (row) row.newPatients += 1;
      }

      // Visits: distinct (patient, day) from measurements and completed appointments.
      const visitKeys = new Set();
      for (const m of measurements) visitKeys.add(`${m.patientId}|${m.date}`);
      for (const a of appointments)
        if (a.status === 'completed') visitKeys.add(`${a.patientId}|${a.date}`);
      const seen = new Set();
      for (const key of visitKeys) {
        const [patientId, date] = /** @type {[string, string]} */ (key.split('|'));
        seen.add(patientId);
        const row = byMonth.get(date.slice(0, 7));
        if (row) row.visits += 1;
      }

      const appointmentStatus = zeroStatuses();
      for (const a of appointments) appointmentStatus[a.status] += 1;
      // Attendance only counts appointments whose day has come.
      const past = appointments.filter((a) => a.date <= today);
      const rate = attendanceRate(
        past.filter((a) => a.status === 'completed').length,
        past.filter((a) => a.status === 'no_show').length,
      );

      // Outcomes: weight change between the first and last measurement in the range.
      /** @type {Map<string, number[]>} */
      const weights = new Map();
      for (const m of measurements) {
        const list = weights.get(m.patientId) ?? [];
        list.push(m.weightKg);
        weights.set(m.patientId, list);
      }
      const goalOf = new Map(patients.map((p) => [p.id, p.goal]));
      const buckets = /** @type {Record<import('@clinic/shared').OutcomeBucket, number>} */ (
        Object.fromEntries(OUTCOME_BUCKETS.map((b) => [b, 0]))
      );
      /** @type {number[]} */
      const changes = [];
      /** @type {Map<string, number[]>} */
      const changesByGoal = new Map();
      for (const [patientId, list] of weights) {
        if (list.length < 2) continue;
        const change = roundTo(
          /** @type {number} */ (list[list.length - 1]) - /** @type {number} */ (list[0]),
          1,
        );
        changes.push(change);
        buckets[outcomeBucket(change)] += 1;
        const goal = goalOf.get(patientId);
        if (goal) changesByGoal.set(goal, [...(changesByGoal.get(goal) ?? []), change]);
      }

      return {
        from,
        to,
        totals: {
          newPatients,
          visits: visitKeys.size,
          patientsSeen: seen.size,
          appointments: appointments.length,
          attendanceRate: rate,
        },
        months: [...byMonth.values()],
        appointmentStatus,
        outcomes: {
          buckets,
          patients: changes.length,
          avgChangeKg: mean(changes),
          byGoal: PATIENT_GOALS.map((goal) => {
            const list = changesByGoal.get(goal) ?? [];
            return { goal, patients: list.length, avgChangeKg: mean(list) };
          }),
        },
      };
    },

    /**
     * @param {string} patientId
     * @returns {Promise<import('@clinic/shared').PatientReport>}
     */
    async patient(patientId) {
      const patient = await repositories.patients.findById(patientId);
      if (!patient) throw notFound('patient');
      const { today } = await clock();
      const [measurements, appointments, plans, prescriptions] = await Promise.all([
        repositories.measurements.listByPatient(patientId),
        repositories.appointments.findAll({ patientId }),
        repositories.dietPlans.listByPatient(patientId),
        repositories.prescriptions.listByPatient(patientId),
      ]);
      const progress = buildProgress(measurements);
      const first = progress.start;
      const last = progress.current;

      const statuses = zeroStatuses();
      for (const a of appointments) statuses[a.status] += 1;
      const past = appointments.filter((a) => a.date <= today);

      return {
        patient,
        generatedOn: today,
        progress,
        stats: {
          visits: progress.visits,
          firstVisit: first?.date ?? null,
          lastVisit: last?.date ?? null,
          followedDays: first && last ? daysBetween(first.date, last.date) : null,
          weightChangeKg: progress.change.weightKg,
          bmiChange: progress.change.bmi,
          goalProgressPct: goalProgressPct({
            goal: patient.goal,
            startKg: first?.weightKg,
            currentKg: last?.weightKg,
            targetKg: patient.targetWeightKg,
          }),
          appointments: statuses,
          attendanceRate: attendanceRate(
            past.filter((a) => a.status === 'completed').length,
            past.filter((a) => a.status === 'no_show').length,
          ),
          prescriptions: prescriptions.length,
        },
        plans: plans.map((p) => ({
          id: p.id,
          title: p.title,
          startDate: p.startDate,
          endDate: p.endDate,
          dailyCalories: p.dailyCalories,
          isActive: p.isActive,
        })),
      };
    },
  };
}

/** @typedef {ReturnType<typeof createReportService>} ReportService */
