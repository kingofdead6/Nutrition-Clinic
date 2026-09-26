# عيادة التغذية — Nutrition Clinic

An Arabic-first (RTL) patient-management platform for a dietitian's clinic. It is a web app
today and is built to become a **fully offline desktop app** (Electron + SQLite) without a rewrite.

> Status: **all 9 phases are done** (scaffold; auth, settings, app shell; patients and measurements; appointments; home dashboard; food database and diet plan builder; prescriptions and print views; reports; backup/restore, seed data, tests and docs). See [docs/SPEC.md](docs/SPEC.md) for the full spec and
> [docs/DECISIONS.md](docs/DECISIONS.md) for decisions and deviations.

## Requirements

- Node.js ≥ 20.19 (developed on 22.14)
- MongoDB running locally (developed against 8.2, `mongodb://127.0.0.1:27017`)

## Getting started

```bash
npm install
cp apps/server/.env.example apps/server/.env     # then adjust if needed
cp apps/client/.env.example apps/client/.env     # optional
npm run seed                                     # optional: demo clinic (empty database only)
npm run dev
```

- Client: http://localhost:5173 (Vite; `/api` is proxied to the server)
- API: http://127.0.0.1:4000/api/health (the `PORT` in `apps/server/.env`; the Vite proxy follows it)

## Scripts (run from the repo root)

| Script                            | What it does                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Shared package (tsup watch), server (`nodemon index.js`) and client (Vite) via `concurrently`               |
| `npm run build`                   | Builds `packages/shared/dist` and `apps/client/dist`. The server is plain JS and needs no build             |
| `npm start`                       | `node index.js` in `apps/server`. Set `CLIENT_DIST_DIR=../client/dist` to serve the UI from the same origin |
| `npm test`                        | Vitest in every workspace (server tests use an in-memory MongoDB)                                           |
| `npm run typecheck`               | `tsc` (strict) for the shared package and the client                                                        |
| `npm run lint` / `npm run format` | ESLint (flat config) / Prettier                                                                             |
| `npm run seed`                    | Fill an **empty** database with the demo clinic (`-- --force` wipes the configured database first)          |
| `npm run backup -- …`             | Backup / restore from the command line, see [Backup and restore](#backup-and-restore)                       |

## Environment variables

**Server** (`apps/server/.env`, see `.env.example`):

| Variable                                    | Default                                      | Notes                                                                                                            |
| ------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `HOST` / `PORT`                             | `127.0.0.1` / `4000`                         | `PORT=0` picks a random free port                                                                                |
| `DB_DRIVER`                                 | `mongo`                                      | `mongo` \| `sqlite` (sqlite: not implemented yet)                                                                |
| `MONGO_URI`                                 | `mongodb://127.0.0.1:27017/nutrition_clinic` |                                                                                                                  |
| `SQLITE_PATH`                               | `<DATA_DIR>/clinic.db`                       | future desktop driver                                                                                            |
| `DATA_DIR`                                  | `./data`                                     | root for uploads, backups, local DB                                                                              |
| `UPLOADS_DIR` / `BACKUP_DIR`                | `<DATA_DIR>/uploads` / `<DATA_DIR>/backups`  |                                                                                                                  |
| `CLIENT_DIST_DIR`                           | _(unset)_                                    | serve the built client from the API server                                                                       |
| `CORS_ORIGIN`                               | `http://localhost:5173`                      | comma-separated exact origins. `*` does not work with cookie auth (unused in dev: the Vite proxy is same-origin) |
| `JWT_SECRET`                                | dev fallback                                 | **required in production** (≥ 32 chars)                                                                          |
| `JWT_EXPIRES_IN_HOURS`                      | `168`                                        |                                                                                                                  |
| `COOKIE_SECURE` / `TRUST_PROXY`             | `false`                                      |                                                                                                                  |
| `LOG_LEVEL` / `LOG_PRETTY`                  | `info` / on in dev                           | pino                                                                                                             |
| `MONGOMS_SYSTEM_BINARY` / `MONGOMS_VERSION` | _(unset)_                                    | tests: use the installed `mongod` instead of downloading one                                                     |

**Client** (`apps/client/.env`): `VITE_API_URL` (default `/api`), `DEV_API_PROXY_TARGET`
(default: `http://127.0.0.1:<PORT from apps/server/.env>`).

## First run and sign-in

- With an empty database the app opens **/setup**, which creates the admin account and the clinic
  info. It is refused once any user exists.
- Sessions are an httpOnly `SameSite=Strict` cookie holding a JWT (`JWT_EXPIRES_IN_HOURS`).
  Changing a password or deactivating a user revokes that user's other sessions (`tokenVersion`).
- Roles: `admin` (settings and users), `nutritionist`, `assistant`. The server always keeps at least
  one active admin.
- Failed logins are rate-limited per IP (`LOGIN_RATE_LIMIT_MAX` per `LOGIN_RATE_LIMIT_WINDOW_MIN`).

## API

| Method & path                                                                                                                                                                                           | Access                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `GET /api/health`                                                                                                                                                                                       | public                         |
| `GET /api/auth/status` (setup needed? + clinic branding)                                                                                                                                                | public                         |
| `POST /api/auth/setup` · `POST /api/auth/login` · `POST /api/auth/logout`                                                                                                                               | public (setup: first run only) |
| `GET /api/auth/me` · `PUT /api/auth/me` · `PUT /api/auth/password`                                                                                                                                      | signed in                      |
| `GET /api/settings`                                                                                                                                                                                     | signed in                      |
| `PUT /api/settings` · `POST /api/settings/logo` · `DELETE /api/settings/logo`                                                                                                                           | admin                          |
| `GET /api/settings/logo` (versioned URL, cached)                                                                                                                                                        | public                         |
| `GET/POST /api/users` · `PUT/DELETE /api/users/:id`                                                                                                                                                     | admin                          |
| `GET /api/patients?search=&status=&gender=&goal=&archived=&sort=&dir=&page=&pageSize=`                                                                                                                  | signed in                      |
| `POST /api/patients` · `GET/PUT /api/patients/:id` · `PATCH /api/patients/:id/archive`                                                                                                                  | signed in                      |
| `DELETE /api/patients/:id` (cascades to the patient's visits, appointments, plans and prescriptions)                                                                                                    | admin                          |
| `GET/POST/DELETE /api/patients/:id/photo`                                                                                                                                                               | signed in                      |
| `GET/POST /api/patients/:id/measurements` · `PUT/DELETE /api/patients/:id/measurements/:measurementId`                                                                                                  | signed in                      |
| `GET /api/patients/:id/progress` (chart series + start / current / change)                                                                                                                              | signed in                      |
| `GET /api/appointments?from=&to=&status=&patientId=&page=&pageSize=` · `POST /api/appointments`                                                                                                         | signed in                      |
| `GET /api/appointments/today` · `GET /api/appointments/upcoming?limit=`                                                                                                                                 | signed in                      |
| `GET/PUT/DELETE /api/appointments/:id` · `PATCH /api/appointments/:id/status`                                                                                                                           | signed in                      |
| `GET /api/dashboard/stats`                                                                                                                                                                              | signed in                      |
| `GET /api/foods?search=&category=&page=&pageSize=` · `GET /api/foods/:id`                                                                                                                               | signed in                      |
| `POST /api/foods` · `PUT/DELETE /api/foods/:id` · `POST /api/foods/import[?dryRun=true]` (CSV) · `POST /api/foods/defaults`                                                                             | admin, nutritionist            |
| `GET /api/diet-plans?patientId=&isTemplate=&isActive=&page=` · `GET /api/diet-plans/:id` · `GET /api/patients/:id/diet-plans`                                                                           | signed in                      |
| `POST /api/diet-plans` · `PUT/DELETE /api/diet-plans/:id` · `POST /api/diet-plans/:id/activate` · `…/deactivate` · `…/duplicate`                                                                        | admin, nutritionist            |
| `GET /api/prescription-templates[/:id]` · `GET /api/prescriptions?patientId=&page=` · `GET /api/prescriptions/:id` · `GET /api/patients/:id/prescriptions`                                              | signed in                      |
| `POST/PUT/DELETE /api/prescription-templates[/:id]` · `POST /api/prescription-templates/defaults` · `POST /api/prescriptions/preview` · `POST /api/prescriptions` · `PUT/DELETE /api/prescriptions/:id` | admin, nutritionist            |
| `GET /api/backup/info` · `GET /api/backup/export` (creates + downloads a zip) · `GET /api/backup/files/:name` · `POST /api/backup/import?dryRun=true` / `?confirm=true`                                 | admin                          |
| `GET /api/reports/overview?from=&to=` (default: last 6 months) · `GET /api/reports/patient/:id`                                                                                                         | signed in                      |

Lists return `{ data, page, pageSize, total }`. Uploads accept PNG, JPEG or WebP up to 2 MB, checked by magic bytes (SVG is refused).

## Printing

Printable documents are client routes rendered as A4 sheets without the app shell, printed
with the browser (`window.print()`), which gets Arabic shaping and RTL right. In the desktop
app these map to Electron's `webContents.print()` / `printToPDF()`.

| Route                     | Document                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `/print/prescription/:id` | Prescription: letterhead, patient, rendered body, recommendations, foods to favor/avoid, signature |
| `/print/diet-plan/:id`    | Diet plan: meal-by-meal table with meal and day totals                                             |
| `/print/patient/:id`      | Patient summary: identity, current measurements, charts, progress table, plan, health info         |
| `/print/report/:id`       | Patient progress report: stats, weight/BMI charts, appointments, plans                             |

Add `?autoprint=1` to open the print dialog once the document has loaded (the app's print
buttons do this in a new tab).

## Deploying (Render)

One web service serves the API and the built client from the same origin. The settings are
in [render.yaml](render.yaml). Use Render → New → Blueprint, or copy them into an existing service:

| Setting           | Value                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build command     | `npm ci && npm run build`                                                                                                                                             |
| Start command     | `npm start`                                                                                                                                                           |
| Health check path | `/api/health`                                                                                                                                                         |
| Environment       | `NODE_ENV=production`, `HOST=0.0.0.0`, `CLIENT_DIST_DIR=../client/dist`, `TRUST_PROXY=true`, `COOKIE_SECURE=true`, `JWT_SECRET` (≥ 32 random characters), `MONGO_URI` |

- `.npmrc` sets `include=dev`. The build tools (tsup, TypeScript, Vite) are devDependencies,
  and npm would otherwise skip them under `NODE_ENV=production`.
- `HOST` must be `0.0.0.0`. The default `127.0.0.1` is only reachable from inside the machine.
- Render's disk is temporary. Uploaded photos, the logo and server-side backups (`DATA_DIR`)
  are lost on every deploy unless you attach a persistent disk and point `DATA_DIR` at it.
  Download backups from the Backup page.
- In Atlas → Network Access, allow Render's outbound IPs (or `0.0.0.0/0`).

## Architecture

```
apps/
  client/            React 18 + Vite + Tailwind (RTL) + TanStack Query + react-i18next
  server/            Express 5 + zod + pino, plain JavaScript (ESM, JSDoc types)
    index.js           run file: load env → startServer
    src/app.js         createApp({ repositories, config }) → Express app (no listen, no connect)
    src/server.js      startServer(config): connect + listen, returns { url, port, close }
    src/repositories/
      interfaces/      one contract per aggregate (JSDoc typedef + method list), checked at startup
      mongo/           the only code that imports mongoose
      sqlite/          placeholder (README) for the desktop driver
      index.js         createRepositories(config) picks the driver from DB_DRIVER
    src/storage/       StorageAdapter + LocalFileStorage (DATA_DIR)
    test/contract/     driver-agnostic repository test suite
packages/
  shared/            TypeScript: zod schemas, types, enums, constants, helpers. Built to dist/ for the
                     server; the client imports src/ directly ("source" export condition)
```

Key rules:

- **Repositories are storage only.** Validation, derived fields (BMI, status, totals) and business
  rules live in services, so every driver behaves the same. Services and routes depend only on
  `repositories/interfaces`. ESLint blocks `mongoose` imports anywhere else.
- **Driver-agnostic data.** UUID `id`s (never `_id`/ObjectId), ISO-string timestamps, `YYYY-MM-DD`
  date-only fields, shallow documents.
- **Offline.** No CDNs, remote fonts or external APIs. The Cairo font is bundled via `@fontsource`.
- **RTL.** Logical Tailwind utilities only (`ms-*`, `pe-*`, `start-*`, `text-start`…), enforced by ESLint.
- **i18n.** Every UI string goes through `t()` with typed keys. Arabic is complete, French is
  scaffolded, and missing keys fall back to Arabic.
- **API errors** are always `{ error: { code, message, details? } }`, with `message` as an i18n key.

## Demo data

`npm run seed` fills an **empty** database (the one `apps/server/.env` points at) with a demo clinic:

- Admin **`admin@clinic.local` / `admin123`**. This is a well-known password, so change it before any real use.
- Clinic settings, the 108 starter foods and the 4 prescription templates.
- 48 patients: the 10 from the mockup plus 38 generated ones, with Algerian mobile numbers (05/06/07…).
- 3–6 visits each between 2026-08-01 and 2026-09-22, with weight trends that follow each patient's goal.
- Active diet plans with varied start dates, some prescriptions, and past, today's and upcoming appointments.
- **فاطمة بن عيسى** matches the mockup: 32 years old, 68 kg, 1.65 m, waist 82 cm, hip 98 cm, body fat 28 %, and a 1500 kcal weight-loss plan from 2026-09-15 for 4 weeks.

The generator is deterministic, so every run produces the same clinic. It refuses to run when
users already exist; `npm run seed -- --force` **wipes** the configured database and its uploads
first. The script prints the target database (without credentials) before it starts.

## Backup and restore

A backup is one zip file: `data.json` (every collection, read through the repository
interfaces, so it is driver-independent) plus `files/…` (logo and patient photos).

**In the app** (admin only, sidebar → النسخ الاحتياطي):

- **Create and download** writes `backup-YYYYMMDD-HHmmss.zip` into `BACKUP_DIR`, records the
  date, and downloads the file. The last 20 backups are kept on the server and can be downloaded again.
- **Restore**: choose a zip, then **check the file**. This is a dry run that validates every
  record and shows the counts per collection. After that, **restore** and confirm. The current
  data is first saved as `…-pre-restore.zip`. Everything is then replaced, and you sign in again,
  because accounts come from the backup.
- An archive is validated completely before anything changes. The server refuses it if it is
  not a backup, comes from a newer app version, contains invalid records (the first 20 are
  listed), or has no active admin.

**From the command line** (no running server needed; uses `apps/server/.env`):

```bash
npm run backup -- export                          # → BACKUP_DIR/backup-….zip
npm run backup -- import path/to/backup.zip        # shows the contents and stops
npm run backup -- import path/to/backup.zip --yes  # replaces all data (safety backup first)
```

## Tests

```bash
npm test          # shared helpers + server (API, services, repository contract, backup, seed)
```

- Server tests start one in-memory MongoDB (`mongodb-memory-server`). Each test file gets its
  own database, and the clock is injectable (`createApp({ now })`).
- `apps/server/test/contract/repositoryContract.js` is **driver-agnostic**: any new driver must pass
  it (`runRepositoryContract('sqlite', factory)`).
- Browser end-to-end checks were run during development with Playwright against a local
  database. They are not part of `npm test`.

## Desktop migration plan

The web app is already shaped for a desktop build. The steps below turn it into an offline
Electron app with SQLite without touching the client or the services.

### 1. Electron main process hosts the server

```js
// electron/main.js (sketch)
import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { loadConfig } from '../apps/server/src/config.js';
import { startServer } from '../apps/server/src/server.js';

const dataDir = path.join(app.getPath('userData'), 'data');
const env = {
  NODE_ENV: 'production',
  HOST: '127.0.0.1',
  DB_DRIVER: 'sqlite',
  DATA_DIR: dataDir,
  CLIENT_DIST_DIR: path.join(process.resourcesPath, 'client'),
  JWT_SECRET: await loadOrCreateSecret(dataDir), // random, stored once in userData
};

async function start(port) {
  return startServer(loadConfig({ ...env, PORT: String(port) }));
}

app.whenReady().then(async () => {
  // Preferred fixed port (stable origin, so cookies and localStorage survive restarts);
  // fall back to a random free port if it is taken.
  const server = await start(47810).catch(() => start(0));
  const win = new BrowserWindow({ width: 1400, height: 900 });
  await win.loadURL(server.url);
  app.on('before-quit', () => void server.close());
});
```

- `createApp()` / `startServer()` already take all settings from a config object, with no global
  state. `startServer` returns `{ url, port, close }`, and `PORT=0` picks a free port.
- `CLIENT_DIST_DIR` makes Express serve the built client, so the UI and the API share one origin.
  The client's default `VITE_API_URL=/api` then works unchanged, and the `SameSite=Strict` cookie
  auth keeps working. No CORS is needed.
- Multi-user roles stay as they are. On a single-seat install the first-run `/setup` creates
  the admin exactly as on the web.

### 2. SQLite driver

- Implement `apps/server/src/repositories/sqlite/` with **better-sqlite3**, one module per
  interface in `repositories/interfaces/`. See `sqlite/README.md` for the table layout: UUID
  text primary keys, ISO-string timestamps, JSON columns for nested arrays (plan days, lists),
  and the same derived `searchKey` normalization for Arabic search.
- Register it in `createRepositories()` (`DB_DRIVER=sqlite`, file at `SQLITE_PATH`, default
  `<DATA_DIR>/clinic.db`).
- Run `runRepositoryContract('sqlite', …)` in the test suite. When it passes, every service and
  route behaves the same, because business rules live in services, not in the driver.
- Uniqueness rules the services rely on (user email, file number, one active plan per patient)
  become `UNIQUE` / partial indexes, which raise the same `DuplicateKeyError`.

### 3. Data and files

- `DATA_DIR` goes in the OS app-data folder (`app.getPath('userData')`). The database, uploads
  and backups all live there, so updates and uninstalls never touch patient data.
- `LocalFileStorage` already writes there. Nothing in the app uses the network, the Cairo font
  is bundled, and there are no CDNs.

### 4. Migrating an existing web installation

Backup/restore **is** the migration path, because it reads and writes only through the
repository interfaces:

1. On the web server (`DB_DRIVER=mongo`): export a backup (the button in the app, or `npm run backup -- export`).
2. In the desktop app (`DB_DRIVER=sqlite`), restore that zip from the Backup page. You can
   also point the CLI at the desktop data folder: `DB_DRIVER=sqlite DATA_DIR=… npm run backup -- import file.zip --yes`.
3. IDs, file numbers, passwords (bcrypt hashes), photos and the logo all carry over.

### 5. Printing

The print views are ordinary routes, so they keep working in Electron. To skip the browser
dialog, map them to `webContents.print()`, or `printToPDF()` for "save as PDF".

### 6. Packaging

- **electron-builder**. Bundle `apps/server` (plain JS, with no build step), `packages/shared/dist`
  and `apps/client/dist` (as `extraResources/client`).
- `better-sqlite3` is a native module: rebuild it for Electron's Node ABI with
  `electron-rebuild` (or electron-builder's `npmRebuild`), and ship Mongo-free (`mongoose` is
  only loaded by the mongo driver, through a dynamic import).
- Remaining work, in order: SQLite driver + contract tests → Electron shell → packaging and
  auto-update → a "backups folder" setting and a reminder when the last backup is old.
