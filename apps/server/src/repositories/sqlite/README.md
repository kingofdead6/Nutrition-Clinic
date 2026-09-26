# SQLite driver (not implemented yet)

The desktop build will store data in a local SQLite file (`<DATA_DIR>/clinic.db`,
configurable with `SQLITE_PATH`), most likely through `better-sqlite3`.

To implement it:

1. Add `createSqliteRepositories(path): Promise<Repositories>` in `./index.js`, implementing
   every interface in `../interfaces/` (one table per aggregate; `id TEXT PRIMARY KEY`
   holding the UUID; dates stay as ISO / `YYYY-MM-DD` text, so they sort correctly).
2. Store nested arrays that belong to one parent as JSON columns: diet plan `days`, patient
   `allergies` / `medications` / `chronicConditions`, prescription lines, settings `workingHours`.
3. Store the storage-only `searchKey` column (built with `buildSearchKey` from
   `#shared`) and search with `LIKE '%' || ? || '%'`, as the Mongo driver does
   with a regex.
4. Enforce "one active plan per patient" with a partial unique index
   (`CREATE UNIQUE INDEX one_active_plan ON diet_plans(patient_id) WHERE is_active = 1`)
   and run `activate()` / `importAll()` inside a transaction.
5. Use a `counters` table for `nextFileNumber()`.
6. Throw `DuplicateKeyError` (from `../errors`) on unique-constraint violations.
7. Wire it into the `sqlite` case of `createRepositories()` in `../index.js`.
8. Run the repository contract suite (`test/contract/`) against it. It must pass
   unchanged.

Migrating an existing Mongo installation: export a backup (`GET /api/backup/export`),
start the app with `DB_DRIVER=sqlite`, and restore it (`POST /api/backup/import`).
Restore goes through these same interfaces.
