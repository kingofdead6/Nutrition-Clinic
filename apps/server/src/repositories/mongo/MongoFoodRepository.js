import { randomUUID } from 'node:crypto';
import { buildSearchKey, normalizeArabic } from '#shared';
import {
  escapeRegex,
  MongoCrudRepository,
  stripUndefined,
  translateErrors,
} from './MongoCrudRepository.js';

/** @typedef {import('#shared').Food} Food */

/**
 * @extends {MongoCrudRepository<Food>}
 * @implements {import('../interfaces/FoodRepository.js').FoodRepository}
 */
export class MongoFoodRepository extends MongoCrudRepository {
  /** @param {import('./models.js').MongoModel} model */
  constructor(model) {
    super(model, (f) => ({ searchKey: buildSearchKey(f.name, f.nameFr) }));
  }

  /**
   * @param {import('../interfaces/FoodRepository.js').FoodFilter} filter
   * @param {import('../interfaces/common.js').PageRequest} page
   */
  async list(filter, page) {
    /** @type {Record<string, unknown>} */
    const q = {};
    if (filter.category) q.category = filter.category;
    if (filter.search) q.searchKey = { $regex: escapeRegex(normalizeArabic(filter.search)) };
    const [items, total] = await Promise.all([
      this.findMany(
        q,
        { category: 1, name: 1 },
        { skip: (page.page - 1) * page.pageSize, limit: page.pageSize },
      ),
      this.model.countDocuments(q).exec(),
    ]);
    return { items, total };
  }

  /** @param {readonly import('../interfaces/common.js').NewEntity<Food>[]} items */
  async createMany(items) {
    if (items.length === 0) return [];
    const now = new Date().toISOString();
    const entities = items.map(
      (data) =>
        /** @type {Food} */ ({
          ...stripUndefined(data),
          id: randomUUID(),
          createdAt: now,
          updatedAt: now,
        }),
    );
    await translateErrors(() => this.collection.insertMany(entities.map((e) => this.toDoc(e))));
    return entities;
  }
}
