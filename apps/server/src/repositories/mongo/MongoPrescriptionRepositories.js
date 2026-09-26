import { MongoCrudRepository } from './MongoCrudRepository.js';

/**
 * @extends {MongoCrudRepository<import('#shared').Prescription>}
 * @implements {import('../interfaces/PrescriptionRepository.js').PrescriptionRepository}
 */
export class MongoPrescriptionRepository extends MongoCrudRepository {
  /** @param {string} patientId */
  listByPatient(patientId) {
    return this.findMany({ patientId }, { date: -1, createdAt: -1 });
  }

  /** @param {string} patientId */
  async deleteByPatient(patientId) {
    const res = await this.model.deleteMany({ patientId }).exec();
    return res.deletedCount;
  }
}

/**
 * @extends {MongoCrudRepository<import('#shared').PrescriptionTemplate>}
 * @implements {import('../interfaces/PrescriptionTemplateRepository.js').PrescriptionTemplateRepository}
 */
export class MongoPrescriptionTemplateRepository extends MongoCrudRepository {
  listAll() {
    return this.findMany({}, { name: 1 });
  }
}
