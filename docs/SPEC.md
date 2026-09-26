# Spec: "عيادة التغذية" (Nutrition Clinic) full-stack web platform

> Original brief from the clinic owner, kept here as the reference for every phase.
> Amendment: the frontend folder is `apps/client` (not `apps/web`) and the backend is `apps/server`.
> Amendment 2: the backend (`apps/server`) is plain JavaScript, with the run file at `apps/server/index.js`
> (this overrides "TypeScript everywhere" for the server; client and shared stay TypeScript).
> Decisions and deviations are logged in [DECISIONS.md](DECISIONS.md).

A production-quality patient-management platform for a dietitian's clinic, Arabic-first with a right-to-left layout. The target home dashboard is an Excel mockup screenshot: reproduce its layout, content and visual identity as a real web app.

**Stack now:** React + Tailwind (frontend), Node.js + Express (backend), MongoDB (database).
**Stack later:** a single offline desktop app with a local database and a local backend that always works, with no internet and no external services.

Every architectural decision exists so that the later migration is a packaging job, not a rewrite. The "Desktop-Readiness Rules" are hard requirements.

Work in phases. After each phase, stop, summarize what was built, list how to run and test it, and wait for confirmation before continuing.

---

## 1. Tech stack

Monorepo with npm workspaces:

```
nutrition-clinic/
├── apps/
│   ├── client/       # React frontend
│   └── server/       # Express backend
├── packages/
│   └── shared/       # Zod schemas, TS types, enums, constants, calculation helpers
├── package.json      # workspaces + root scripts
└── README.md
```

- **Language:** TypeScript everywhere, strict mode.
- **Frontend (`apps/client`):**
  - Vite + React 18 + TypeScript
  - Tailwind CSS v3 with RTL support, using logical utilities only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) and never `ml-`/`mr-`/`left-`/`right-` for layout
  - React Router v6, and TanStack Query for all server state
  - react-hook-form + zod (via `@hookform/resolvers`), with schemas imported from `packages/shared`
  - Recharts for charts, lucide-react for icons
  - react-i18next with Arabic (`ar`) as the default and only complete locale, structured so French (`fr`) can be added. Every UI string goes through `t()`.
  - Fonts bundled locally via `@fontsource/cairo` (or Tajawal), with no Google Fonts CDN
  - `date-fns`, with dates displayed as `yyyy/MM/dd`
- **Backend (`apps/server`):**
  - Node 20+, Express, TypeScript
  - Mongoose only inside the Mongo repository implementation
  - zod validation on every body, query and params, using the shared schemas
  - pino, helmet, cors (configurable origin), compression
  - JWT in an httpOnly cookie, bcrypt password hashes
  - Vitest + Supertest, with `mongodb-memory-server` for integration tests
- **Tooling:** ESLint, Prettier, `concurrently` (for `npm run dev`), and `.env.example` files for both apps.

## 2. Desktop-Readiness Rules (mandatory)

The app will later ship as a desktop app (likely Electron, with Express running inside the main process) and a local embedded DB (likely SQLite via `better-sqlite3`).

1. **Repository pattern with swappable drivers.**
   - There is one interface per aggregate in `apps/server/src/repositories/interfaces/`: `PatientRepository`, `MeasurementRepository`, `AppointmentRepository`, `DietPlanRepository`, `PrescriptionRepository`, `PrescriptionTemplateRepository`, `FoodRepository`, `SettingsRepository`, `UserRepository`.
   - Implementations live in `repositories/mongo/`. An empty `repositories/sqlite/` holds a README.
   - `createRepositories(config)` picks the driver from `DB_DRIVER=mongo|sqlite`; `sqlite` throws "not implemented" for now.
   - Services and routes depend only on the interfaces. Nothing outside `repositories/mongo/` imports Mongoose.
2. **Driver-agnostic data model.**
   - UUID string `id`s from `crypto.randomUUID()`; never expose `_id`/`ObjectId`.
   - Dates are ISO strings or `Date` converted at the repository boundary. Date-only fields are `YYYY-MM-DD` strings.
   - No aggregation pipelines inside services and no `$lookup` dependencies. Statistics are computed in the service layer or behind a repository method (e.g. `getDashboardStats()`) that each driver implements.
   - Documents stay shallow; only arrays that clearly belong to a single parent are nested (e.g. meals in a diet plan).
3. **The server is an importable app.**
   - `apps/server/src/app.ts` exports `createApp({ repositories, config })`, which returns an Express app.
   - `index.ts` is only the CLI entry point: load config, connect the DB, `listen`. Electron will later call `createApp()` itself on `127.0.0.1`.
   - Port, host, DB driver, DB path/URI, uploads dir and backup dir all come from config.
4. **Fully offline.** No CDN links, remote fonts or images, analytics, or external APIs at runtime. Default avatars are local SVGs.
5. **File storage via an adapter.** A `StorageAdapter` interface (`save`, `read`, `delete`, `getPath`) with a `LocalFileStorage` implementation writing to a configurable `DATA_DIR`. No cloud storage.
6. **Configurable API base URL.** One `apiClient` reads `import.meta.env.VITE_API_URL` (default `/api`); Vite proxies `/api` in dev.
7. **Printing through the browser.** Dedicated React print routes with `@media print` CSS, triggered by `window.print()`. These map to Electron's `webContents.print()`/`printToPDF()` later.
8. **Driver-independent backup.** A JSON export of all collections plus uploaded files, zipped via `archiver`. Restore imports the same format through the repository interfaces, which doubles as the Mongo → SQLite migration tool.
9. **Auth for a single-clinic desktop app.** Multiple users with roles `admin`, `nutritionist` and `assistant`, while a single-user clinic still works smoothly. A first-run setup screen creates the admin account and clinic info when no users exist.

## 3. Domain model (`packages/shared`, zod schemas + inferred types)

Every entity has `id`, `createdAt` and `updatedAt`.

- **User:** `name`, `email`, `passwordHash` (server only), `role`, `isActive`.
- **ClinicSettings** (singleton):
  - `clinicName` (default "عيادة التغذية") and `tagline` (default "صحتك ... توازن حياتك")
  - `logoPath`, `address`, `phone`, `email`
  - `practitionerName` and `practitionerTitle` (default "أخصائية التغذية")
  - `defaultAppointmentDurationMin` (30), `workingHours`, `printFooterText`, `locale`
- **Patient:**
  - Identity and contact: `fileNumber` (auto `P-0001`), `firstName`, `lastName`, `fullName` (derived), `gender` (`male` | `female`), `birthDate` (age derived, never stored), `phone`, `email`, `address`, `occupation`, `photoPath`
  - Health: `chronicConditions: string[]` (diabetes, hypertension, thyroid, celiac, or none) plus `medicalNotes`, `allergies: string[]`, `medications: string[]`, and `activityLevel` (`sedentary` | `light` | `moderate` | `active` | `very_active`)
  - Goals and status: `goal` (`weight_loss` | `weight_gain` | `maintenance` | `therapeutic`), `targetWeightKg`, `status`, `archived`
  - `status` values: `follow_up` (متابعة, green), `new_plan` (خطة جديدة, blue), `plan_ended` (انتهاء الخطة, orange), `inactive` (غير نشط, gray)
  - Status is computed automatically: `new_plan` if a plan started within the last 7 days, `plan_ended` if the active plan's end date has passed, otherwise `follow_up`. It can be overridden manually with `statusOverride`.
- **Measurement** (one per visit):
  - Recorded: `patientId`, `date`, `weightKg`, `heightM`, `waistCm`, `hipCm`, `bodyFatPct`, and optional `muscleMassKg`, `visceralFat`, `waterPct`, `notes`
  - Derived by shared helpers and never trusted from the client: `bmi = weight / height²` (1 decimal), `bmiCategory` (WHO: underweight / normal / overweight / obese I–III), and `waistHipRatio` (2 decimals)
- **Appointment:**
  - Fields: `patientId`, `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `durationMin`, `type`, `status`, `notes`
  - `type`: `follow_up` (متابعة) | `new_consultation` (استشارة جديدة) | `measurement_only` (قياسات فقط)
  - `status`: `pending` (معلق, yellow) | `confirmed` (مؤكد, green) | `completed` (تم) | `cancelled` (ملغى) | `no_show` (لم يحضر)
  - Overlapping times cannot be double-booked.
- **Food:**
  - `name` (Arabic), optional `nameFr`
  - `category`: grains, proteins, dairy, fruits, vegetables, fats, sweets, drinks, traditional Algerian dishes
  - `servingSize` and `servingUnit` (g, ml, piece, cup, tbsp)
  - Per serving: `calories`, `proteinG`, `carbsG`, `fatG`, `fiberG`
  - `isCustom`
- **DietPlan:**
  - Fields: `patientId`, `title`, `goal`, `dailyCalories`, `macroTargets { proteinPct, carbsPct, fatPct }`, `startDate`, `durationWeeks`, `endDate` (derived), `isActive`, `notes`, `days`
  - `days` holds one entry per weekday template, or a single "daily" template. Each day has `meals` of `{ mealType (breakfast / snack / lunch / snack / dinner), time, items: [{ foodId, quantity, unit, computed calories/macros }] }`.
  - Per-meal and per-day totals are computed by shared helpers.
  - A patient has one active plan at most; activating a new plan deactivates the previous one.
- **PrescriptionTemplate:**
  - Fields: `name`, `type`, `bodyRichText` (placeholders such as `{{patientName}}`, `{{dailyCalories}}`, `{{date}}`), `recommendations[]`, `foodsToAvoid[]`, `foodsToFavor[]`
  - `type`: `weight_loss` (وصفة إنقاص الوزن), `balanced` (وصفة متوازنة), `diabetic` (وصفة لمرضى السكري), `weight_gain` (وصفة لزيادة الوزن), `custom`
- **Prescription:** `patientId`, `templateId`, `type`, `date`, `renderedContent` (snapshotted when issued), optional `dietPlanId`.

## 4. REST API (`/api/...`)

Conventions:

- JSON responses
- Paginated lists return `{ data, page, pageSize, total }`
- Errors return `{ error: { code, message, details? } }`
- One central error handler

Endpoints:

- **auth:** `POST /auth/setup` (first run only), `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **users:** CRUD (admin only)
- **settings:** `GET /settings`, `PUT /settings`, `POST /settings/logo`
- **patients:**
  - CRUD
  - `GET /patients?search=&status=&gender=&goal=&sort=&page=`, where search matches name, phone or file number
  - `POST /patients/:id/photo`, `PATCH /patients/:id/archive`
- **patients/:id/measurements:** CRUD, plus `GET /patients/:id/progress` (chart time series plus starting, current and total change)
- **appointments:**
  - CRUD
  - `GET /appointments?from=&to=&status=&patientId=`, `GET /appointments/today`, `GET /appointments/upcoming?limit=`
  - `PATCH /appointments/:id/status`
- **foods:** CRUD, search and category filter, plus `POST /foods/import` (CSV)
- **diet-plans:** CRUD, `GET /patients/:id/diet-plans`, `POST /diet-plans/:id/activate`, `POST /diet-plans/:id/duplicate`
- **prescription-templates:** CRUD
- **prescriptions:** CRUD, `GET /patients/:id/prescriptions`, and `POST /prescriptions` (renders the template with patient data)
- **dashboard:** `GET /dashboard/stats`, which returns:
  - `totalPatients` and `todayAppointments`
  - `avgWeightLossKg`: over `weight_loss` patients with ≥2 measurements, the mean of (first − latest), counting positive losses only
  - `avgWeightGainKg`: the same for `weight_gain`
  - `patientsByStatus` and `newPatientsThisMonth`
- **reports:** `GET /reports/overview?from=&to=` (visits, new patients, outcomes, attendance rate) and `GET /reports/patient/:id`
- **backup:** `GET /backup/export` (zip download) and `POST /backup/import` (restore, with a confirmation flag and a dry-run mode that returns counts)
- **health:** `GET /health`

## 5. Frontend pages and UI

### Global layout (match the screenshot)

- `<html dir="rtl" lang="ar">`.
- **Right sidebar** (dark green, about `#14532d`):
  - Nav items with icons: الواجهة الرئيسية، المرضى، المواعيد، الخطط الغذائية، الوصفات، التقارير، قاعدة الأطعمة، الإعدادات، النسخ الاحتياطي
  - The active item as a lighter green pill
  - The quote "التغذية السليمة هي أساس الحياة الصحية" with a leaf icon at the bottom
  - Collapsible on smaller screens
- **Top header:**
  - Logo, clinic name and tagline on the start (right) side
  - "مرحبا بك {practitionerTitle}" with an avatar menu (profile, logout)
  - "التاريخ اليوم: yyyy/MM/dd"
- **Theme:**
  - A `brand` green palette
  - Status colors: green = follow_up/confirmed, blue = new_plan, orange = plan_ended, yellow = pending, red = cancelled, gray = inactive
  - Soft pastel KPI cards (light green, light blue, light purple, light red)
- **Reusable components:** `StatCard`, `DataTable` (sortable, paginated, empty and loading states), `StatusBadge`, `SearchInput` (debounced), `Modal`, `ConfirmDialog`, `Tabs`, `FormField`, `DatePicker`, `Toast`, `PageHeader`, `EmptyState`, `Skeleton`.
- Loading, error and empty states everywhere.

### Pages

1. **Login / first-run setup.**
2. **Home dashboard (`/`):** a faithful rebuild of the screenshot.
   - A row of 4 KPI cards (total patients, today's appointments, average weight loss, average weight gain), each with an icon in a colored circle.
   - Right column:
     - **Patient list** with search and columns #، الاسم الكامل، العمر، الجنس، الهاتف، تاريخ آخر زيارة، الحالة. Clicking a row loads the patient into the side panel.
     - **Upcoming appointments** with columns التاريخ، الساعة، النوع، الحالة (one date column and one time column; the mockup's duplicated "الساعة" is a bug).
   - Left column, the **patient quick panel**:
     - Photo, name, age, gender and phone
     - Buttons: تعديل البيانات، طباعة الوصفة، طباعة ملخص المريض
     - Tabs: الملف الشخصي، القياسات والتطور، الخطة الغذائية، المواعيد، التقارير
     - The profile tab shows the basic info card; the current measurements card (BMI with its category, and the waist-to-hip ratio); the weight line chart; the grouped waist/hip bar chart; the current plan card (goal, calories, duration, start date, and a "عرض تفاصيل الخطة" button); and recent prescriptions.
   - With no patient selected, default to the most recently visited one.
3. **Patients (`/patients`):**
   - Full list with filters (status, gender, goal, archived) and an add button.
   - **Patient detail (`/patients/:id`)** is the full-page version of the quick panel, with tabs: Profile; Measurements & progress (all visits, add-measurement form, and charts for weight, BMI, waist/hip and body fat); Diet plans; Appointments; Prescriptions; Reports.
   - The patient form has sections for identity, contact, health and goals.
4. **Appointments (`/appointments`):**
   - Week and day calendar views (a simple custom grid) plus a list view.
   - A create/edit modal with patient autocomplete.
   - Quick status changes from the list, and a "today" shortcut.
5. **Diet plans (`/diet-plans`):**
   - A list of all plans.
   - The **plan builder**:
     - Pick a patient, then set goal, calories and macros. An optional suggested calorie target (Mifflin-St Jeor × activity factor ± goal adjustment) comes from a shared helper and is shown as a suggestion only.
     - Add meals, then foods from the database with quantities.
     - Live per-meal and per-day totals with progress bars against the targets.
   - Plans can be duplicated or saved as templates, and printed.
6. **Prescriptions (`/prescriptions`):**
   - Template management with placeholder help.
   - Issue to a patient: preview, save and print.
7. **Reports (`/reports`):**
   - A date-range filter.
   - Charts: new patients per month, visits per month, appointment status breakdown, and outcome distribution (kg lost or gained).
   - A printable per-patient progress report.
8. **Food database (`/foods`):** a searchable, filterable table with CRUD and CSV import.
9. **Settings (`/settings`):** clinic info and logo, practitioner info, working hours, user management (admin), and language (Arabic for now).
10. **Backup (`/backup`):** an export button, import with dry-run preview and confirmation, and the date of the last backup.

### Print views (`/print/...`, no sidebar or header)

- **Prescription:** a letterhead (logo, name, contact, date), then patient name and age, the rendered body, recommendations, foods to favor and avoid, and a signature line.
- **Diet plan:** a meal-by-meal table with totals.
- **Patient summary:** identity, current measurements, a progress table and charts.
- All A4, RTL, and print-tested.

## 6. Seed data (`npm run seed`)

- Admin user `admin@clinic.local` / `admin123`, with a warning printed to change it.
- Clinic settings.
- About 80 common foods, including Algerian staples (couscous, chorba, kesra/matlou', dates, lben, rechta, loubia, etc.) with realistic nutrition values.
- The 4 prescription templates in Arabic.
- 48 patients: the screenshot names (فاطمة بن عيسى، أحمد سعيد، سارة مدني، يوسف قاسي، نورة زغبي، محمد العربي، خديجة لعموري، علي بوزيد، إيمان كمال، ليلى منصوري) plus generated ones, with Algerian phones (`05/06/07xxxxxxxx`).
- 3–6 measurements per patient between 2026/08/01 and 2026/09/22, with realistic trends.
- Active diet plans and a mix of past and future appointments, so the dashboard looks like the screenshot. For example, فاطمة بن عيسى: 32 years old, 68 kg, 1.65 m, waist 82, hip 98, fat 28%, on a 1500 kcal weight-loss plan starting 2026/09/15 for 4 weeks.

## 7. Quality requirements

- Strict TypeScript, no `any`, and shared types between front and back.
- zod on both sides, with Arabic validation messages via i18n.
- Security:
  - Rate-limit the login route
  - Enforce roles in middleware
  - Sanitize uploads (images only, 2 MB max)
  - Never return password hashes
- Tests:
  - Unit tests for the shared helpers (BMI, WHR, age, calories, status, plan totals)
  - Integration tests for the patients, measurements, appointments and dashboard-stats endpoints against `mongodb-memory-server`
  - One suite that runs against the repository interfaces, so the SQLite driver can reuse it
- Accessibility: keyboard navigation, labels on all inputs, sufficient contrast.
- Desktop-first, usable on a tablet.
- README covering setup, env vars, scripts, and architecture, plus a **"Desktop migration plan"**: Electron main process calling `createApp()`, the SQLite driver, `DATA_DIR` in OS app-data, backup/restore as the migration path, and electron-builder packaging.

## 8. Phases (stop after each one for review)

1. **Scaffold:** monorepo, tooling, shared package, Tailwind + RTL + fonts + i18n, the Express app factory, config, the repository interfaces and Mongo driver skeleton, error handling, and the health route. `npm run dev` works.
2. **Auth + Settings + Layout:** first-run setup, login, protected routes, and the sidebar/header shell matching the screenshot.
3. **Patients + Measurements:** CRUD, search, status computation, progress charts, and the calculation helpers with tests.
4. **Appointments:** CRUD, calendar views, and conflict detection.
5. **Home dashboard:** a pixel-faithful rebuild of the screenshot, wired to real data.
6. **Food database + Diet plan builder.**
7. **Prescriptions + Print views.**
8. **Reports.**
9. **Backup/Restore + Seed script + Tests + README** (including the desktop migration plan).
