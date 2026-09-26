import { MongoCrudRepository } from './MongoCrudRepository.js';

/** @typedef {import('../interfaces/UserRepository.js').UserRecord} UserRecord */

/**
 * @extends {MongoCrudRepository<UserRecord>}
 * @implements {import('../interfaces/UserRepository.js').UserRepository}
 */
export class MongoUserRepository extends MongoCrudRepository {
  /** @param {string} email */
  async findByEmail(email) {
    const doc = /** @type {import('./models.js').StoredDoc | null} */ (
      await this.model.findOne({ email: email.trim().toLowerCase() }).lean().exec()
    );
    return doc ? this.toEntity(doc) : null;
  }

  listAll() {
    return this.findMany({}, { name: 1 });
  }
}
