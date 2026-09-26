import { MongoCrudRepository, translateErrors } from './MongoCrudRepository.js';

/** @typedef {import('@clinic/shared').DietPlan} DietPlan */
/** @typedef {import('../interfaces/DietPlanRepository.js').DietPlanFilter} DietPlanFilter */

/**
 * @extends {MongoCrudRepository<DietPlan>}
 * @implements {import('../interfaces/DietPlanRepository.js').DietPlanRepository}
 */
export class MongoDietPlanRepository extends MongoCrudRepository {
  /** @param {DietPlanFilter} filter */
  toQuery(filter) {
    /** @type {Record<string, unknown>} */
    const q = {};
    if (filter.patientId) q.patientId = filter.patientId;
    if (filter.isActive !== undefined) q.isActive = filter.isActive;
    if (filter.isTemplate !== undefined) q.isTemplate = filter.isTemplate;
    return q;
  }

  /**
   * @param {DietPlanFilter} filter
   * @param {import('../interfaces/common.js').PageRequest} page
   */
  async list(filter, page) {
    const q = this.toQuery(filter);
    const [items, total] = await Promise.all([
      this.findMany(
        q,
        { startDate: -1, createdAt: -1 },
        { skip: (page.page - 1) * page.pageSize, limit: page.pageSize },
      ),
      this.model.countDocuments(q).exec(),
    ]);
    return { items, total };
  }

  /** @param {string} patientId */
  listByPatient(patientId) {
    return this.findMany({ patientId }, { startDate: -1, createdAt: -1 });
  }

  /** @param {string} patientId */
  async findActiveByPatient(patientId) {
    const [plan] = await this.findMany(
      { patientId, isActive: true },
      { startDate: -1 },
      { limit: 1 },
    );
    return plan ?? null;
  }

  /** @param {readonly string[]} patientIds */
  findActiveByPatients(patientIds) {
    if (patientIds.length === 0) return Promise.resolve([]);
    return this.findMany({ patientId: { $in: [...patientIds] }, isActive: true });
  }

  /**
   * Standalone MongoDB has no multi-document transactions, so this deactivates the
   * others first and then activates the target; the partial unique index
   * `one_active_plan` guarantees the invariant even under concurrent calls.
   * @param {string} planId
   */
  async activate(planId) {
    const plan = await this.findById(planId);
    if (!plan || !plan.patientId) return null;
    const now = new Date().toISOString();
    await this.model
      .updateMany(
        { patientId: plan.patientId, isActive: true, _id: { $ne: planId } },
        { $set: { isActive: false, updatedAt: now } },
      )
      .exec();
    await translateErrors(() =>
      this.model.updateOne({ _id: planId }, { $set: { isActive: true, updatedAt: now } }).exec(),
    );
    return { ...plan, isActive: true, updatedAt: now };
  }

  /** @param {string} patientId */
  async deleteByPatient(patientId) {
    const res = await this.model.deleteMany({ patientId }).exec();
    return res.deletedCount;
  }
}
