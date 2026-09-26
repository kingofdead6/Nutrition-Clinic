import { planEndDate, planItemFromFood } from '@clinic/shared';
import { AppError, fieldError, notFound } from '../lib/errors.js';

/** @typedef {import('@clinic/shared').DietPlan} DietPlan */
/** @typedef {import('@clinic/shared').DietPlanWithPatient} DietPlanWithPatient */

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {{ patients: import('./patientService.js').PatientService }} deps
 */
export function createDietPlanService({ repositories }, { patients }) {
  const repo = repositories.dietPlans;

  /** @param {string} id */
  async function getOrThrow(id) {
    const plan = await repo.findById(id);
    if (!plan) throw notFound('dietPlan');
    return plan;
  }

  /** @param {DietPlan[]} list @returns {Promise<DietPlanWithPatient[]>} */
  async function withPatients(list) {
    const ids = [...new Set(list.map((p) => p.patientId).filter((id) => id !== null))];
    const found = await repositories.patients.findByIds(ids);
    const byId = new Map(found.map((p) => [p.id, p]));
    return list.map((plan) => {
      const p = plan.patientId ? byId.get(plan.patientId) : undefined;
      return {
        ...plan,
        patient: p ? { id: p.id, fullName: p.fullName, fileNumber: p.fileNumber } : null,
      };
    });
  }

  /** @param {DietPlan} plan */
  const joined = async (plan) =>
    /** @type {DietPlanWithPatient} */ ((await withPatients([plan]))[0]);

  /**
   * Turns client items ({ foodId, quantity }) into snapshotted items with the food's
   * name, unit and nutrition. The unit is always the food's own serving unit.
   * @param {import('@clinic/shared').DietPlanCreateInput['days']} days
   * @returns {Promise<DietPlan['days']>}
   */
  async function resolveDays(days) {
    const ids = [
      ...new Set(days.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.foodId)))),
    ];
    const foods = new Map((await repositories.foods.findByIds(ids)).map((f) => [f.id, f]));
    return days.map((day, di) => ({
      day: day.day,
      meals: day.meals.map((meal, mi) => ({
        mealType: meal.mealType,
        time: meal.time,
        notes: meal.notes,
        items: meal.items.map((item, ii) => {
          const food = foods.get(item.foodId);
          if (!food)
            throw fieldError(`days.${di}.meals.${mi}.items.${ii}.foodId`, 'errors.foodNotFound');
          return planItemFromFood(food, item.quantity);
        }),
      })),
    }));
  }

  /** @param {string | null} patientId @param {boolean} isTemplate */
  async function assertOwner(patientId, isTemplate) {
    if (isTemplate) return;
    if (!patientId) throw fieldError('patientId', 'validation.required');
    if (!(await repositories.patients.findById(patientId)))
      throw fieldError('patientId', 'errors.notFound.patient');
  }

  /** Status depends on the active plan (new plan / plan ended). @param {string | null} patientId */
  const refreshPatient = (patientId) =>
    patientId ? patients.refresh(patientId).then(() => undefined) : Promise.resolve();

  return {
    /** @param {import('@clinic/shared').DietPlanListQuery} q */
    async list(q) {
      const { items, total } = await repo.list(
        { patientId: q.patientId, isTemplate: q.isTemplate, isActive: q.isActive },
        { page: q.page, pageSize: q.pageSize },
      );
      return { data: await withPatients(items), page: q.page, pageSize: q.pageSize, total };
    },

    /** @param {string} patientId */
    async listForPatient(patientId) {
      await patients.get(patientId);
      return withPatients(await repo.listByPatient(patientId));
    },

    /** @param {string} id */
    async get(id) {
      return joined(await getOrThrow(id));
    },

    /** @param {import('@clinic/shared').DietPlanCreateInput} input */
    async create(input) {
      const { activate, ...fields } = input;
      const patientId = fields.isTemplate ? null : fields.patientId;
      await assertOwner(patientId, fields.isTemplate);
      const created = await repo.create({
        ...fields,
        patientId,
        days: await resolveDays(fields.days),
        endDate: planEndDate(fields.startDate, fields.durationWeeks),
        isActive: false,
      });
      if (activate && !fields.isTemplate) return this.activate(created.id);
      return joined(created);
    },

    /**
     * @param {string} id
     * @param {import('@clinic/shared').DietPlanUpdateInput} patch
     */
    async update(id, patch) {
      const current = await getOrThrow(id);
      const isTemplate = patch.isTemplate ?? current.isTemplate;
      const patientId = isTemplate ? null : (patch.patientId ?? current.patientId);
      if (isTemplate && current.isActive)
        throw new AppError('CONFLICT', 'errors.activePlanToTemplate');
      if (patch.patientId !== undefined || patch.isTemplate !== undefined)
        await assertOwner(patientId, isTemplate);
      const startDate = patch.startDate ?? current.startDate;
      const durationWeeks = patch.durationWeeks ?? current.durationWeeks;
      /** @type {Partial<DietPlan>} */
      const changes = {
        ...patch,
        days: undefined,
        patientId,
        isTemplate,
        endDate: planEndDate(startDate, durationWeeks),
      };
      if (patch.days) changes.days = await resolveDays(patch.days);
      // Moving an active plan to another patient would break "one active plan each".
      if (current.isActive && patientId !== current.patientId) changes.isActive = false;
      const updated = /** @type {DietPlan} */ (await repo.update(id, changes));
      await refreshPatient(current.patientId);
      if (patientId !== current.patientId) await refreshPatient(patientId);
      return joined(updated);
    },

    /** Makes this the patient's only active plan. @param {string} id */
    async activate(id) {
      const plan = await getOrThrow(id);
      if (plan.isTemplate || !plan.patientId)
        throw new AppError('CONFLICT', 'errors.templateNotActivatable');
      const activated = /** @type {DietPlan} */ (await repo.activate(id));
      await refreshPatient(plan.patientId);
      return joined(activated);
    },

    /** @param {string} id */
    async deactivate(id) {
      const plan = await getOrThrow(id);
      const updated = /** @type {DietPlan} */ (await repo.update(id, { isActive: false }));
      await refreshPatient(plan.patientId);
      return joined(updated);
    },

    /**
     * Copies a plan (meals keep their snapshots): same patient, another patient
     * (e.g. applying a template), or as a template.
     * @param {string} id
     * @param {import('@clinic/shared').DietPlanDuplicateInput} options
     */
    async duplicate(id, options) {
      const source = await getOrThrow(id);
      const isTemplate = options.isTemplate;
      const patientId = isTemplate ? null : (options.patientId ?? source.patientId);
      await assertOwner(patientId, isTemplate);
      const startDate = options.startDate ?? source.startDate;
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = source;
      const copy = await repo.create({
        ...rest,
        title: options.title ?? source.title,
        patientId,
        isTemplate,
        startDate,
        endDate: planEndDate(startDate, source.durationWeeks),
        isActive: false,
      });
      if (options.activate && !isTemplate) return this.activate(copy.id);
      return joined(copy);
    },

    /** @param {string} id */
    async remove(id) {
      const plan = await getOrThrow(id);
      await repo.delete(id);
      if (plan.isActive) await refreshPatient(plan.patientId);
    },
  };
}

/** @typedef {ReturnType<typeof createDietPlanService>} DietPlanService */
