import { FOOD_CSV_COLUMNS, foodCreateSchema, normalizeArabic } from '@clinic/shared';
import { AppError, notFound } from '../lib/errors.js';
import { parseCsv } from '../lib/csv.js';
import { defaultFoods } from '../data/defaultFoods.js';

/** @typedef {import('@clinic/shared').Food} Food */

const NUMERIC = new Set(['servingSize', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG']);
export const MAX_IMPORT_ROWS = 2000;

/** @param {import('../context.js').AppContext} ctx */
export function createFoodService({ repositories }) {
  const repo = repositories.foods;

  /** @param {string} id */
  async function getOrThrow(id) {
    const food = await repo.findById(id);
    if (!food) throw notFound('food');
    return food;
  }

  /** Normalized names already in the database, to skip duplicates on import. */
  async function existingNames() {
    return new Set((await repo.exportAll()).map((f) => normalizeArabic(f.name)));
  }

  return {
    /** @param {import('@clinic/shared').FoodListQuery} q */
    async list(q) {
      const { items, total } = await repo.list(
        { search: q.search, category: q.category },
        { page: q.page, pageSize: q.pageSize },
      );
      return { data: items, page: q.page, pageSize: q.pageSize, total };
    },

    get: getOrThrow,

    /** @param {import('@clinic/shared').FoodCreateInput} input */
    create(input) {
      return repo.create({ ...input, isCustom: true });
    },

    /** @param {string} id @param {import('@clinic/shared').FoodUpdateInput} patch */
    async update(id, patch) {
      await getOrThrow(id);
      return /** @type {Food} */ (await repo.update(id, patch));
    },

    /**
     * Deleting a food never alters existing plans: their items keep the snapshotted
     * name and nutrition.
     * @param {string} id
     */
    async remove(id) {
      await getOrThrow(id);
      await repo.delete(id);
    },

    /**
     * Installs the starter foods that are not in the database yet (matched by name).
     * @returns {Promise<{ added: number }>}
     */
    async installDefaults() {
      const names = await existingNames();
      const missing = defaultFoods().filter((f) => !names.has(normalizeArabic(f.name)));
      await repo.createMany(missing);
      return { added: missing.length };
    },

    /**
     * Imports foods from CSV (header row with the FOOD_CSV_COLUMNS names, any order).
     * Invalid rows are reported with their line number; rows whose name already exists
     * are skipped. `dryRun` validates without writing.
     * @param {string} text
     * @param {{ dryRun?: boolean }} [options]
     * @returns {Promise<import('@clinic/shared').FoodImportResult>}
     */
    async importCsv(text, { dryRun = false } = {}) {
      const rows = parseCsv(text);
      const header = (rows.shift() ?? []).map((h) => h.trim());
      const missingColumns = ['name', 'category', 'servingSize', 'servingUnit', 'calories'].filter(
        (c) => !header.includes(c),
      );
      if (missingColumns.length) {
        throw new AppError('VALIDATION_ERROR', 'errors.csvColumns', {
          missing: missingColumns,
          expected: FOOD_CSV_COLUMNS,
        });
      }
      if (rows.length > MAX_IMPORT_ROWS)
        throw new AppError('PAYLOAD_TOO_LARGE', 'errors.csvTooManyRows');

      const names = await existingNames();
      /** @type {import('@clinic/shared').FoodImportResult['errors']} */
      const errors = [];
      /** @type {import('../repositories/interfaces/common.js').NewEntity<Food>[]} */
      const toCreate = [];
      let skipped = 0;

      rows.forEach((cells, index) => {
        const line = index + 2;
        /** @type {Record<string, unknown>} */
        const raw = {};
        header.forEach((col, i) => {
          const value = (cells[i] ?? '').trim();
          if (!FOOD_CSV_COLUMNS.includes(/** @type {any} */ (col)) || value === '') return;
          raw[col] = NUMERIC.has(col) ? Number(value.replace(',', '.')) : value;
        });
        const parsed = foodCreateSchema.safeParse(raw);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          errors.push({
            line,
            message: 'errors.csvRow',
            details: `${issue?.path.join('.')}: ${issue?.message}`,
          });
          return;
        }
        const key = normalizeArabic(parsed.data.name);
        if (names.has(key)) {
          skipped += 1;
          return;
        }
        names.add(key);
        toCreate.push({ ...parsed.data, isCustom: true });
      });

      if (!dryRun) await repo.createMany(toCreate);
      return { imported: toCreate.length, skipped, errors, dryRun };
    },
  };
}

/** @typedef {ReturnType<typeof createFoodService>} FoodService */
