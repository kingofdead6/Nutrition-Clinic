import { MongoCrudRepository } from './MongoCrudRepository.js';

/** @typedef {import('../interfaces/AppointmentRepository.js').AppointmentFilter} AppointmentFilter */

/** @type {Record<string, 1>} */
const ORDER = { date: 1, time: 1 };

/**
 * @extends {MongoCrudRepository<import('@clinic/shared').Appointment>}
 * @implements {import('../interfaces/AppointmentRepository.js').AppointmentRepository}
 */
export class MongoAppointmentRepository extends MongoCrudRepository {
  /** @param {AppointmentFilter} filter */
  toQuery(filter) {
    /** @type {Record<string, unknown>} */
    const q = {};
    if (filter.from || filter.to) {
      q.date = {
        ...(filter.from ? { $gte: filter.from } : {}),
        ...(filter.to ? { $lte: filter.to } : {}),
      };
    }
    if (filter.status) q.status = filter.status;
    else if (filter.statuses) q.status = { $in: [...filter.statuses] };
    if (filter.patientId) q.patientId = filter.patientId;
    return q;
  }

  /**
   * @param {AppointmentFilter} filter
   * @param {import('../interfaces/common.js').PageRequest} page
   */
  async list(filter, page) {
    const q = this.toQuery(filter);
    const [items, total] = await Promise.all([
      this.findMany(q, ORDER, { skip: (page.page - 1) * page.pageSize, limit: page.pageSize }),
      this.model.countDocuments(q).exec(),
    ]);
    return { items, total };
  }

  /** @param {AppointmentFilter} filter */
  findAll(filter) {
    return this.findMany(this.toQuery(filter), ORDER);
  }

  /**
   * @param {{ date: string, time: string }} from
   * @param {readonly import('@clinic/shared').AppointmentStatus[]} statuses
   * @param {number} limit
   */
  findUpcoming(from, statuses, limit) {
    return this.findMany(
      {
        status: { $in: [...statuses] },
        $or: [{ date: { $gt: from.date } }, { date: from.date, time: { $gte: from.time } }],
      },
      ORDER,
      { limit },
    );
  }

  /** @param {string} patientId */
  async deleteByPatient(patientId) {
    const res = await this.model.deleteMany({ patientId }).exec();
    return res.deletedCount;
  }
}
