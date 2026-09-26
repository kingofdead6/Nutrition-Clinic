import { CRUD_METHODS } from './common.js';

/** @typedef {import('@clinic/shared').Food} Food */

/**
 * @typedef {object} FoodFilter
 * @property {string} [search]  Matched against the normalized Arabic and French names.
 * @property {import('@clinic/shared').FoodCategory} [category]
 */

/**
 * @typedef {import('./common.js').CrudRepository<Food> & {
 *   list(
 *     filter: FoodFilter,
 *     page: import('./common.js').PageRequest,
 *   ): Promise<import('./common.js').ListResult<Food>>,
 *   createMany(items: readonly import('./common.js').NewEntity<Food>[]): Promise<Food[]>,
 * }} FoodRepository
 *
 * - `list`: ordered by category then name.
 */

export const FOOD_REPOSITORY_METHODS = Object.freeze([...CRUD_METHODS, 'list', 'createMany']);
