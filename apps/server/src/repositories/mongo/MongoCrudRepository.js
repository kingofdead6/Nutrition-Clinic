import { randomUUID } from 'node:crypto';
import { DuplicateKeyError } from '../errors.js';

/** @typedef {import('./models.js').StoredDoc} StoredDoc */
/** @typedef {import('./models.js').MongoModel} MongoModel */

/** Storage-only fields that are never returned to callers. */
const INTERNAL_FIELDS = new Set(['_id', 'searchKey']);

const nowIso = () => new Date().toISOString();

/**
 * @template {object} T
 * @param {T} obj
 * @returns {Partial<T>}
 */
export function stripUndefined(obj) {
  return /** @type {Partial<T>} */ (
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
  );
}

/** @param {string} s */
export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Runs a write and turns Mongo's duplicate-key error (11000) into DuplicateKeyError.
 * @template R
 * @param {() => Promise<R>} op
 * @returns {Promise<R>}
 */
export async function translateErrors(op) {
  try {
    return await op();
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
      const keyPattern = 'keyPattern' in err && err.keyPattern ? err.keyPattern : {};
      throw new DuplicateKeyError(Object.keys(keyPattern).join(',') || 'unknown');
    }
    throw err;
  }
}

/**
 * Generic Mongo implementation of CrudRepository. The entity UUID is stored as `_id`;
 * `derive` adds storage-only fields (e.g. a normalized `searchKey`) on every write.
 *
 * @template {{ id: string, createdAt: string, updatedAt: string }} T
 * @implements {import('../interfaces/common.js').CrudRepository<T>}
 */
export class MongoCrudRepository {
  /**
   * @param {MongoModel} model
   * @param {(entity: T) => Record<string, unknown>} [derive]
   */
  constructor(model, derive) {
    this.model = model;
    this.derive = derive;
  }

  /** Native collection with string ids (bypasses Mongoose casting on writes). */
  get collection() {
    const db = this.model.db.db;
    if (!db) throw new Error('MongoDB is not connected');
    return db.collection(this.model.collection.name);
  }

  /**
   * @param {StoredDoc} doc
   * @returns {T}
   */
  toEntity(doc) {
    /** @type {Record<string, unknown>} */
    const out = { id: doc._id };
    for (const [k, v] of Object.entries(doc)) {
      if (!INTERNAL_FIELDS.has(k)) out[k] = v;
    }
    return /** @type {T} */ (out);
  }

  /**
   * @param {T} entity
   * @returns {StoredDoc}
   */
  toDoc(entity) {
    const { id, ...rest } = entity;
    return { ...rest, ...(this.derive?.(entity) ?? {}), _id: id };
  }

  /**
   * @param {Record<string, unknown>} filter
   * @param {Record<string, 1 | -1>} [sort]
   * @param {{ skip?: number, limit?: number }} [opts]
   * @returns {Promise<T[]>}
   */
  async findMany(filter, sort = { createdAt: 1 }, opts = {}) {
    let q = this.model.find(filter).sort({ ...sort, _id: 1 });
    if (opts.skip) q = q.skip(opts.skip);
    if (opts.limit) q = q.limit(opts.limit);
    const docs = /** @type {StoredDoc[]} */ (await q.lean().exec());
    return docs.map((d) => this.toEntity(d));
  }

  /** @param {import('../interfaces/common.js').NewEntity<T>} data */
  async create(data) {
    const now = nowIso();
    const entity = /** @type {T} */ ({
      ...stripUndefined(data),
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
    await translateErrors(() => this.collection.insertOne(this.toDoc(entity)));
    return entity;
  }

  /** @param {string} id */
  async findById(id) {
    const doc = /** @type {StoredDoc | null} */ (await this.model.findById(id).lean().exec());
    return doc ? this.toEntity(doc) : null;
  }

  /** @param {readonly string[]} ids */
  findByIds(ids) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findMany({ _id: { $in: [...ids] } });
  }

  /**
   * @param {string} id
   * @param {import('../interfaces/common.js').EntityPatch<T>} patch
   */
  async update(id, patch) {
    const current = await this.findById(id);
    if (!current) return null;
    const next = /** @type {T} */ ({
      ...current,
      ...stripUndefined(patch),
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: nowIso(),
    });
    await translateErrors(() => this.collection.replaceOne({ _id: id }, this.toDoc(next)));
    return next;
  }

  /** @param {string} id */
  async delete(id) {
    const res = await this.model.deleteOne({ _id: id }).exec();
    return res.deletedCount > 0;
  }

  count() {
    return this.model.countDocuments({}).exec();
  }

  exportAll() {
    return this.findMany({}, { createdAt: 1 });
  }

  /** @param {readonly T[]} records */
  async importAll(records) {
    await this.model.deleteMany({}).exec();
    const docs = records.map((r) => this.toDoc(r));
    for (let i = 0; i < docs.length; i += 1000) {
      await translateErrors(() => this.collection.insertMany(docs.slice(i, i + 1000)));
    }
  }
}
