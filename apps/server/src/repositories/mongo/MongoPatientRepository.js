import { buildSearchKey, FILE_NUMBER_PREFIX, normalizeArabic, PATIENT_STATUSES } from '#shared';
import { escapeRegex, MongoCrudRepository } from './MongoCrudRepository.js';

/** @typedef {import('#shared').Patient} Patient */
/** @typedef {import('#shared').PatientStatus} PatientStatus */
/** @typedef {import('../interfaces/PatientRepository.js').PatientFilter} PatientFilter */

const COUNTER_ID = 'patientFileNumber';

/** @param {number} n */
const formatFileNumber = (n) => `${FILE_NUMBER_PREFIX}${String(n).padStart(4, '0')}`;

/**
 * @extends {MongoCrudRepository<Patient>}
 * @implements {import('../interfaces/PatientRepository.js').PatientRepository}
 */
export class MongoPatientRepository extends MongoCrudRepository {
  /** @param {Pick<import('./models.js').Models, 'patients' | 'counters'>} models */
  constructor(models) {
    super(models.patients, (p) => ({
      searchKey: buildSearchKey(p.fullName, `${p.lastName} ${p.firstName}`, p.phone, p.fileNumber),
    }));
    this.counters = models.counters;
  }

  /** @param {PatientFilter} filter */
  toQuery(filter) {
    /** @type {Record<string, unknown>} */
    const q = {};
    if (filter.archived !== undefined) q.archived = filter.archived;
    if (filter.status) q.status = filter.status;
    if (filter.gender) q.gender = filter.gender;
    if (filter.goal) q.goal = filter.goal;
    if (filter.search) {
      const term = normalizeArabic(filter.search);
      const digits = term.replace(/[\s.-]/g, '');
      const terms = /^\+?\d+$/.test(digits) ? [term, digits] : [term];
      q.$or = terms.map((t) => ({ searchKey: { $regex: escapeRegex(t) } }));
    }
    return q;
  }

  /**
   * @param {PatientFilter} filter
   * @param {import('../interfaces/common.js').PageRequest} page
   * @param {import('../interfaces/common.js').SortRequest<import('#shared').PatientSortField>} sort
   */
  async list(filter, page, sort) {
    const q = this.toQuery(filter);
    const dir = sort.dir === 'asc' ? 1 : -1;
    const [items, total] = await Promise.all([
      this.findMany(
        q,
        { [sort.field]: dir },
        { skip: (page.page - 1) * page.pageSize, limit: page.pageSize },
      ),
      this.model.countDocuments(q).exec(),
    ]);
    return { items, total };
  }

  /** @param {PatientFilter} [filter] */
  findAll(filter = {}) {
    return this.findMany(this.toQuery(filter), { fileNumber: 1 });
  }

  async nextFileNumber() {
    const doc = await this.counters
      .findOneAndUpdate(
        { _id: COUNTER_ID },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return formatFileNumber(doc?.seq ?? 1);
  }

  /** @param {Pick<PatientFilter, 'archived'>} [filter] */
  async countByStatus(filter = {}) {
    /** @type {{ _id: PatientStatus, n: number }[]} */
    const rows = await this.model
      .aggregate([{ $match: this.toQuery(filter) }, { $group: { _id: '$status', n: { $sum: 1 } } }])
      .exec();
    const out = /** @type {Record<PatientStatus, number>} */ (
      Object.fromEntries(PATIENT_STATUSES.map((s) => [s, 0]))
    );
    for (const r of rows) if (r._id in out) out[r._id] = r.n;
    return out;
  }

  /** @param {string} fromIso @param {string} toIso */
  countCreatedBetween(fromIso, toIso) {
    return this.model.countDocuments({ createdAt: { $gte: fromIso, $lt: toIso } }).exec();
  }

  /** @param {readonly Patient[]} records */
  async importAll(records) {
    await super.importAll(records);
    // Keep the file-number counter ahead of every imported number.
    const max = records.reduce((m, p) => {
      const n = Number.parseInt(p.fileNumber.replace(FILE_NUMBER_PREFIX, ''), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    await this.counters
      .updateOne({ _id: COUNTER_ID }, { $set: { seq: max } }, { upsert: true })
      .exec();
  }
}
