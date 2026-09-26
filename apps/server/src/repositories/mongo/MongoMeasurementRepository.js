import { MongoCrudRepository } from './MongoCrudRepository.js';

/**
 * @extends {MongoCrudRepository<import('#shared').Measurement>}
 * @implements {import('../interfaces/MeasurementRepository.js').MeasurementRepository}
 */
export class MongoMeasurementRepository extends MongoCrudRepository {
  /** @param {string} patientId */
  listByPatient(patientId) {
    return this.findMany({ patientId }, { date: 1, createdAt: 1 });
  }

  /** @param {readonly string[]} patientIds */
  listByPatients(patientIds) {
    if (patientIds.length === 0) return Promise.resolve([]);
    return this.findMany(
      { patientId: { $in: [...patientIds] } },
      { patientId: 1, date: 1, createdAt: 1 },
    );
  }

  /** @param {string} from @param {string} to */
  listBetween(from, to) {
    return this.findMany({ date: { $gte: from, $lte: to } }, { date: 1, createdAt: 1 });
  }

  /** @param {string} patientId */
  async deleteByPatient(patientId) {
    const res = await this.model.deleteMany({ patientId }).exec();
    return res.deletedCount;
  }
}
