import { Schema } from 'mongoose';

/**
 * Raw stored document. `_id` holds the entity's UUID string (no ObjectId anywhere).
 * Field shapes are owned by the shared zod schemas and enforced in services, so the
 * Mongoose schemas only declare the id and indexes.
 * @typedef {{ _id: string } & Record<string, unknown>} StoredDoc
 */

/** @typedef {import('mongoose').Model<StoredDoc>} MongoModel */

/**
 * @param {import('mongoose').Connection} conn
 * @param {string} name
 * @param {Array<[Record<string, 1 | -1>, import('mongoose').IndexOptions?]>} indexes
 * @returns {MongoModel}
 */
function defineModel(conn, name, indexes) {
  const schema = new Schema(
    { _id: { type: String, required: true } },
    { collection: name, strict: false, versionKey: false, minimize: false, autoIndex: false },
  );
  for (const [fields, options] of indexes) schema.index(fields, options);
  return conn.model(name, schema);
}

/** @param {import('mongoose').Connection} conn */
export function createModels(conn) {
  const models = {
    users: defineModel(conn, 'users', [[{ email: 1 }, { unique: true }]]),
    settings: defineModel(conn, 'settings', []),
    patients: defineModel(conn, 'patients', [
      [{ fileNumber: 1 }, { unique: true }],
      [{ archived: 1, lastVisitDate: -1 }],
      [{ status: 1 }],
      [{ searchKey: 1 }],
      [{ createdAt: 1 }],
    ]),
    measurements: defineModel(conn, 'measurements', [[{ patientId: 1, date: 1 }], [{ date: 1 }]]),
    appointments: defineModel(conn, 'appointments', [
      [{ date: 1, time: 1 }],
      [{ patientId: 1, date: 1 }],
    ]),
    foods: defineModel(conn, 'foods', [[{ category: 1, name: 1 }], [{ searchKey: 1 }]]),
    dietPlans: defineModel(conn, 'dietPlans', [
      [{ patientId: 1, startDate: -1 }],
      // Enforces "one active plan per patient" at the storage level.
      [
        { patientId: 1 },
        { unique: true, partialFilterExpression: { isActive: true }, name: 'one_active_plan' },
      ],
    ]),
    prescriptions: defineModel(conn, 'prescriptions', [[{ patientId: 1, date: -1 }]]),
    prescriptionTemplates: defineModel(conn, 'prescriptionTemplates', [[{ name: 1 }]]),
  };
  const counters = conn.model(
    'counters',
    new Schema(
      { _id: { type: String, required: true }, seq: { type: Number, required: true } },
      { collection: 'counters', versionKey: false },
    ),
  );
  return { ...models, counters };
}

/** @typedef {ReturnType<typeof createModels>} Models */

/**
 * Builds all indexes. Called once at startup.
 * @param {Models} models
 */
export async function ensureIndexes(models) {
  await Promise.all(Object.values(models).map((m) => m.createIndexes()));
}
