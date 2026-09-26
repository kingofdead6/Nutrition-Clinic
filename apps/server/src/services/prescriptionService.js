import { ageOn, fillPlaceholders, formatDateOnly, todayIn } from '@clinic/shared';
import { fieldError, notFound } from '../lib/errors.js';
import { sanitizeRichText } from '../lib/sanitize.js';
import { defaultPrescriptionTemplates } from '../data/defaultPrescriptionTemplates.js';

/** @typedef {import('@clinic/shared').Prescription} Prescription */
/** @typedef {import('@clinic/shared').PrescriptionWithPatient} PrescriptionWithPatient */

/**
 * Templates and issued prescriptions. Issuing renders the template's placeholders with
 * the patient's data and **snapshots** the result, so later template edits never change
 * an issued prescription.
 * @param {import('../context.js').AppContext} ctx
 * @param {{ settings: import('./settingsService.js').SettingsService }} deps
 */
export function createPrescriptionService({ repositories, now }, { settings }) {
  const templates = repositories.prescriptionTemplates;
  const repo = repositories.prescriptions;

  /** @param {string} id */
  async function getTemplate(id) {
    const tpl = await templates.findById(id);
    if (!tpl) throw notFound('prescriptionTemplate');
    return tpl;
  }

  /** @param {string} id */
  async function getOrThrow(id) {
    const p = await repo.findById(id);
    if (!p) throw notFound('prescription');
    return p;
  }

  /** @param {Prescription[]} list @returns {Promise<PrescriptionWithPatient[]>} */
  async function withPatients(list) {
    const found = await repositories.patients.findByIds([...new Set(list.map((p) => p.patientId))]);
    const byId = new Map(found.map((p) => [p.id, p]));
    return list.map((rx) => {
      const p = byId.get(rx.patientId);
      return {
        ...rx,
        patient: p
          ? {
              id: p.id,
              fullName: p.fullName,
              fileNumber: p.fileNumber,
              birthDate: p.birthDate,
              gender: p.gender,
            }
          : null,
      };
    });
  }

  /** @param {Prescription} rx */
  const joined = async (rx) =>
    /** @type {PrescriptionWithPatient} */ ((await withPatients([rx]))[0]);

  /**
   * Renders a template for a patient: the chosen plan, or the patient's active plan,
   * provides calories and the plan title; the latest visit provides weight/height/BMI.
   * @param {import('@clinic/shared').PrescriptionCreateInput} input
   * @returns {Promise<import('@clinic/shared').PrescriptionPreview & { templateId: string, dietPlanId: string | null }>}
   */
  async function render(input) {
    const [patient, tpl, clinic] = await Promise.all([
      repositories.patients.findById(input.patientId),
      getTemplate(input.templateId),
      settings.get(),
    ]);
    if (!patient) throw fieldError('patientId', 'errors.notFound.patient');
    const today = todayIn(clinic.timezone, now());
    const date = input.date ?? today;

    /** @type {import('@clinic/shared').DietPlan | null} */
    let plan;
    if (input.dietPlanId) {
      plan = await repositories.dietPlans.findById(input.dietPlanId);
      if (!plan || plan.patientId !== patient.id)
        throw fieldError('dietPlanId', 'errors.notFound.dietPlan');
    } else {
      plan = await repositories.dietPlans.findActiveByPatient(patient.id);
    }
    const visits = await repositories.measurements.listByPatient(patient.id);
    const latest = visits[visits.length - 1];

    const values = {
      patientName: patient.fullName,
      patientAge: ageOn(patient.birthDate, date),
      patientGender: patient.gender === 'female' ? 'أنثى' : 'ذكر',
      fileNumber: patient.fileNumber,
      date: formatDateOnly(date),
      weightKg: latest?.weightKg,
      heightM: latest?.heightM,
      bmi: latest?.bmi,
      targetWeightKg: patient.targetWeightKg,
      dailyCalories: plan?.dailyCalories,
      planTitle: plan?.title,
      practitionerName: clinic.practitionerName,
      clinicName: clinic.clinicName,
    };

    return {
      templateId: tpl.id,
      dietPlanId: plan?.id ?? null,
      title: tpl.name,
      type: tpl.type,
      date,
      // The template body was sanitized on save; values are escaped by fillPlaceholders.
      renderedContent: sanitizeRichText(fillPlaceholders(tpl.bodyRichText, values)),
      recommendations: [...tpl.recommendations],
      foodsToAvoid: [...tpl.foodsToAvoid],
      foodsToFavor: [...tpl.foodsToFavor],
    };
  }

  return {
    // ---- templates ----
    listTemplates: () => templates.listAll(),
    getTemplate,

    /** @param {import('@clinic/shared').PrescriptionTemplateCreateInput} input */
    createTemplate(input) {
      return templates.create({ ...input, bodyRichText: sanitizeRichText(input.bodyRichText) });
    },

    /** @param {string} id @param {import('@clinic/shared').PrescriptionTemplateUpdateInput} patch */
    async updateTemplate(id, patch) {
      await getTemplate(id);
      const clean =
        patch.bodyRichText === undefined
          ? patch
          : { ...patch, bodyRichText: sanitizeRichText(patch.bodyRichText) };
      return /** @type {import('@clinic/shared').PrescriptionTemplate} */ (
        await templates.update(id, clean)
      );
    },

    /** Issued prescriptions keep their snapshot, so deleting a template is safe. @param {string} id */
    async removeTemplate(id) {
      await getTemplate(id);
      await templates.delete(id);
    },

    /** Adds the starter templates that are missing (by name). */
    async installDefaultTemplates() {
      const names = new Set((await templates.listAll()).map((t) => t.name));
      const missing = defaultPrescriptionTemplates().filter((t) => !names.has(t.name));
      for (const t of missing) await templates.create(t);
      return { added: missing.length };
    },

    // ---- issued prescriptions ----
    /** @param {import('@clinic/shared').PrescriptionListQuery} q */
    async list(q) {
      if (q.patientId) {
        const all = await repo.listByPatient(q.patientId);
        const start = (q.page - 1) * q.pageSize;
        return {
          data: await withPatients(all.slice(start, start + q.pageSize)),
          page: q.page,
          pageSize: q.pageSize,
          total: all.length,
        };
      }
      const all = (await repo.exportAll()).sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
      );
      const start = (q.page - 1) * q.pageSize;
      return {
        data: await withPatients(all.slice(start, start + q.pageSize)),
        page: q.page,
        pageSize: q.pageSize,
        total: all.length,
      };
    },

    /** @param {string} patientId */
    async listForPatient(patientId) {
      if (!(await repositories.patients.findById(patientId))) throw notFound('patient');
      return withPatients(await repo.listByPatient(patientId));
    },

    /** @param {string} id */
    async get(id) {
      return joined(await getOrThrow(id));
    },

    /** Renders without saving. @param {import('@clinic/shared').PrescriptionCreateInput} input */
    async preview(input) {
      const { templateId: _t, dietPlanId: _d, ...doc } = await render(input);
      return doc;
    },

    /** @param {import('@clinic/shared').PrescriptionCreateInput} input */
    async create(input) {
      const doc = await render(input);
      return joined(await repo.create({ ...doc, patientId: input.patientId }));
    },

    /** Edits the issued text before printing (the template is not touched). @param {string} id @param {import('@clinic/shared').PrescriptionUpdateInput} patch */
    async update(id, patch) {
      await getOrThrow(id);
      const clean =
        patch.renderedContent === undefined
          ? patch
          : { ...patch, renderedContent: sanitizeRichText(patch.renderedContent) };
      return joined(/** @type {Prescription} */ (await repo.update(id, clean)));
    },

    /** @param {string} id */
    async remove(id) {
      await getOrThrow(id);
      await repo.delete(id);
    },
  };
}

/** @typedef {ReturnType<typeof createPrescriptionService>} PrescriptionService */
