/**
 * Entity data without the fields every repository assigns (id, createdAt, updatedAt).
 * @template T
 * @typedef {Omit<T, 'id' | 'createdAt' | 'updatedAt'>} NewEntity
 */

/**
 * @template T
 * @typedef {Partial<NewEntity<T>>} EntityPatch
 */

/**
 * @template T
 * @typedef {{ items: T[], total: number }} ListResult
 */

/** @typedef {{ page: number, pageSize: number }} PageRequest */

/**
 * @template {string} F
 * @typedef {{ field: F, dir: 'asc' | 'desc' }} SortRequest
 */

/**
 * Operations every aggregate supports. Repositories are storage only: validation,
 * derived fields and business rules live in services, so every driver behaves the same.
 * - `create` assigns `id` (UUID), `createdAt` and `updatedAt`.
 * - `update` bumps `updatedAt`; resolves null when the id does not exist.
 * - `exportAll` / `importAll` power driver-independent backup/restore. `importAll`
 *   replaces the collection and preserves ids and timestamps as given.
 *
 * @template T
 * @typedef {object} CrudRepository
 * @property {(data: NewEntity<T>) => Promise<T>} create
 * @property {(id: string) => Promise<T | null>} findById
 * @property {(ids: readonly string[]) => Promise<T[]>} findByIds
 * @property {(id: string, patch: EntityPatch<T>) => Promise<T | null>} update
 * @property {(id: string) => Promise<boolean>} delete
 * @property {() => Promise<number>} count
 * @property {() => Promise<T[]>} exportAll
 * @property {(records: readonly T[]) => Promise<void>} importAll
 */

export const CRUD_METHODS = Object.freeze([
  'create',
  'findById',
  'findByIds',
  'update',
  'delete',
  'count',
  'exportAll',
  'importAll',
]);
