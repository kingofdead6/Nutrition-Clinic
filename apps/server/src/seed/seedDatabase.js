import {
  addDays,
  appointmentCreateSchema,
  clinicSettingsUpdateSchema,
  dietPlanCreateSchema,
  measurementCreateSchema,
  patientCreateSchema,
  prescriptionCreateSchema,
  setupSchema,
  ageOn,
  BACKUP_COLLECTIONS,
  DEFAULT_MACROS,
  minutesToTime,
  roundTo,
  suggestCalories,
  timeToMinutes,
  todayIn,
  weekdayOf,
} from '@clinic/shared';

/** @typedef {import('@clinic/shared').PatientGoal} PatientGoal */

export const SEED_ADMIN = {
  email: 'admin@clinic.local',
  password: 'admin123',
  name: 'سارة بن علي',
};

/** Deterministic PRNG (mulberry32), so every seed produces the same clinic. @param {number} seed */
function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** @param {number} min @param {number} max */
    range: (min, max) => min + next() * (max - min),
    /** @param {number} min @param {number} max */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    /** @template T @param {readonly T[]} list @returns {T} */
    pick: (list) => /** @type {any} */ (list[Math.floor(next() * list.length)]),
    /** @param {number} p */
    chance: (p) => next() < p,
  };
}

/** The ten patients shown in the mockup. */
const MOCKUP_PATIENTS = [
  ['فاطمة', 'بن عيسى', 'female'],
  ['أحمد', 'سعيد', 'male'],
  ['سارة', 'مدني', 'female'],
  ['يوسف', 'قاسي', 'male'],
  ['نورة', 'زغبي', 'female'],
  ['محمد', 'العربي', 'male'],
  ['خديجة', 'لعموري', 'female'],
  ['علي', 'بوزيد', 'male'],
  ['إيمان', 'كمال', 'female'],
  ['ليلى', 'منصوري', 'female'],
];
const FEMALE = [
  'أمينة',
  'حورية',
  'سميرة',
  'نادية',
  'كريمة',
  'وردة',
  'فريدة',
  'صبرينة',
  'ياسمينة',
  'مريم',
  'لمياء',
  'رشيدة',
  'حنان',
  'نسيمة',
  'زهرة',
  'دليلة',
  'سهام',
  'فتيحة',
  'جميلة',
];
const MALE = [
  'كريم',
  'رضا',
  'سمير',
  'عبد القادر',
  'مراد',
  'بلال',
  'إسماعيل',
  'حمزة',
  'نبيل',
  'رشيد',
  'مصطفى',
  'عمر',
  'سفيان',
  'ياسين',
  'فاروق',
  'جمال',
  'هشام',
  'توفيق',
  'عادل',
];
const LAST = [
  'بلقاسم',
  'حداد',
  'مسعودي',
  'بن علي',
  'قاسمي',
  'عمراني',
  'شريف',
  'بوعلام',
  'زروقي',
  'بلعيد',
  'مزياني',
  'سعيداني',
  'بن يوسف',
  'رحماني',
  'خليفي',
  'عيساوي',
  'بوضياف',
  'لعريبي',
  'مداني',
  'بن شيخ',
];
const OCCUPATIONS = [
  'أستاذة',
  'مهندس',
  'موظفة',
  'طالب',
  'ممرضة',
  'تاجر',
  'ربة بيت',
  'محاسب',
  'سائق',
  'طبيبة',
  '',
];
const ALLERGIES = ['اللاكتوز', 'الغلوتين', 'الفول السوداني', 'البيض', 'السمك'];

/** Meal templates (~1500 kcal); quantities are scaled to each plan's calorie target. */
const MEAL_TEMPLATES = [
  [
    [
      'breakfast',
      '08:00',
      [
        ['شوفان', 40],
        ['حليب خالي الدسم', 250],
        ['تمر (دقلة نور)', 2],
      ],
    ],
    [
      'morning_snack',
      '10:30',
      [
        ['تفاح', 1],
        ['لوز', 15],
      ],
    ],
    [
      'lunch',
      '13:00',
      [
        ['كسكس مطبوخ', 150],
        ['صدر دجاج مشوي', 120],
        ['كوسة', 100],
        ['جزر', 80],
      ],
    ],
    ['afternoon_snack', '16:30', [['ياغورت طبيعي', 1]]],
    [
      'dinner',
      '19:30',
      [
        ['شربة فريك', 300],
        ['خبز كامل', 50],
        ['خس', 80],
      ],
    ],
  ],
  [
    [
      'breakfast',
      '07:30',
      [
        ['خبز كامل', 50],
        ['بيض مسلوق', 2],
        ['جبن أبيض طري', 50],
        ['طماطم', 100],
      ],
    ],
    ['morning_snack', '10:30', [['برتقال', 1]]],
    [
      'lunch',
      '13:00',
      [
        ['أرز كامل مطبوخ', 130],
        ['سمك أبيض مشوي', 150],
        ['فاصوليا خضراء', 150],
        ['زيت الزيتون', 1],
      ],
    ],
    [
      'afternoon_snack',
      '17:00',
      [
        ['لبن', 250],
        ['تمر (دقلة نور)', 2],
      ],
    ],
    [
      'dinner',
      '20:00',
      [
        ['عدس مطبوخ', 150],
        ['خبز الشعير', 50],
        ['خيار', 100],
      ],
    ],
  ],
];

/** Rounds a scaled quantity to what a person would actually serve. @param {number} q @param {string} unit */
function roundQuantity(q, unit) {
  if (unit === 'g') return Math.max(5, Math.round(q / 5) * 5);
  if (unit === 'ml') return Math.max(50, Math.round(q / 10) * 10);
  return Math.max(1, Math.round(q));
}

/** Clinic open days (Sunday–Thursday, Saturday): moves a Friday to the Thursday before. @param {string} d */
const openDay = (d) => (weekdayOf(d) === 5 ? addDays(d, -1) : d);

/**
 * Fills an empty database with a realistic demo clinic through the real services (so
 * file numbers, BMI, statuses and conflict checks behave exactly as in the app).
 * @param {{
 *   repositories: import('../repositories/index.js').Repositories,
 *   services: import('../services/index.js').Services,
 *   storage: import('../storage/StorageAdapter.js').StorageAdapter,
 *   now: () => Date,
 *   reset?: boolean,
 *   log?: (msg: string) => void,
 * }} options
 */
export async function seedDatabase({
  repositories,
  services,
  storage,
  now,
  reset = false,
  log = () => {},
}) {
  if ((await repositories.users.count()) > 0) {
    if (!reset)
      throw new Error('The database already has users. Run with --force to wipe it and reseed.');
    for (const name of BACKUP_COLLECTIONS) await repositories[name].importAll([]);
    for (const key of await storage.list()) await storage.delete(key);
    log('Existing data wiped.');
  }

  const r = rng(20260926);
  const tz = 'Africa/Algiers';
  const today = todayIn(tz, now());

  // ---- clinic, admin, starter foods and templates ----
  await services.auth.setup(
    setupSchema.parse({
      admin: { name: SEED_ADMIN.name, email: SEED_ADMIN.email, password: SEED_ADMIN.password },
      clinic: {
        clinicName: 'عيادة التغذية',
        tagline: 'صحتك ... توازن حياتك',
        practitionerName: 'سارة بن علي',
        practitionerTitle: 'أخصائية التغذية',
        phone: '021456789',
        address: 'حي النصر، الجزائر العاصمة',
      },
    }),
  );
  await services.settings.update(
    clinicSettingsUpdateSchema.parse({
      email: 'contact@clinic.local',
      printFooterText: 'العيادة مفتوحة من الأحد إلى الخميس 08:30–16:30 والسبت 09:00–13:00',
    }),
  );
  const foods = new Map((await repositories.foods.exportAll()).map((f) => [f.name, f]));
  const templates = await repositories.prescriptionTemplates.listAll();
  const templateByType = new Map(templates.map((t) => [t.type, t]));
  log(`Clinic, admin, ${foods.size} foods and ${templates.length} templates.`);

  /** Free appointment times per date (working hours, 30-minute slots). */
  const taken = new Map();
  /** @param {string} date @param {string} [preferred] */
  const slot = (date, preferred) => {
    const saturday = weekdayOf(date) === 6;
    const [open, close] = saturday ? ['09:00', '13:00'] : ['08:30', '16:30'];
    const used = taken.get(date) ?? new Set();
    taken.set(date, used);
    const times = [];
    for (let m = timeToMinutes(open); m + 30 <= timeToMinutes(close); m += 30)
      times.push(minutesToTime(m));
    const order = preferred ? [preferred, ...times] : times.slice().sort(() => r.next() - 0.5);
    const time = order.find((x) => times.includes(x) && !used.has(x)) ?? null;
    if (time) used.add(time);
    return time;
  };

  // ---- patients ----
  const people = [
    ...MOCKUP_PATIENTS,
    ...Array.from({ length: 38 }, (_, i) => {
      const gender = i % 2 === 0 ? 'female' : 'male';
      return [r.pick(gender === 'female' ? FEMALE : MALE), LAST[(i * 7) % LAST.length], gender];
    }),
  ];
  const usedPhones = new Set();
  let patientCount = 0;
  let measurementCount = 0;
  let planCount = 0;
  let appointmentCount = 0;
  let prescriptionCount = 0;

  for (const [index, [firstName, lastName, gender]] of people.entries()) {
    const isFatima = index === 0;
    /** @type {PatientGoal} */
    const goal = isFatima
      ? 'weight_loss'
      : r.pick([
          'weight_loss',
          'weight_loss',
          'weight_loss',
          'weight_loss',
          'weight_gain',
          'maintenance',
          'therapeutic',
        ]);
    const birthDate = isFatima
      ? '1994-03-10'
      : `${r.int(1965, 2004)}-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}`;
    let phone;
    do phone = `0${r.pick([5, 6, 7])}${String(r.int(10000000, 99999999))}`;
    while (usedPhones.has(phone));
    usedPhones.add(phone);

    const heightM = isFatima
      ? 1.65
      : roundTo(gender === 'female' ? r.range(1.52, 1.72) : r.range(1.65, 1.88), 2);
    const startBmi = {
      weight_loss: r.range(26.5, 35),
      weight_gain: r.range(16.8, 19),
      maintenance: r.range(21, 25),
      therapeutic: r.range(23, 31),
    }[goal];
    const endWeight = isFatima ? 68 : null;
    const perVisit = {
      weight_loss: -r.range(0.5, 1.4),
      weight_gain: r.range(0.4, 0.9),
      maintenance: r.range(-0.3, 0.3),
      therapeutic: -r.range(0, 0.6),
    }[goal];
    const visits = isFatima ? 5 : r.int(3, 6);
    const startWeight =
      endWeight != null
        ? roundTo(endWeight - perVisit * (visits - 1), 1)
        : roundTo(startBmi * heightM * heightM, 1);
    const target =
      goal === 'weight_loss'
        ? isFatima
          ? 62
          : Math.round(24.5 * heightM * heightM)
        : goal === 'weight_gain'
          ? Math.round(21 * heightM * heightM)
          : null;
    const conditions =
      goal === 'therapeutic'
        ? [r.pick(['diabetes_t2', 'hypertension', 'hypothyroidism', 'dyslipidemia', 'pcos'])]
        : r.chance(0.12)
          ? ['hypertension']
          : [];
    const stopped = !isFatima && index >= 40 && index % 4 === 0; // stopped coming → marked inactive

    const patient = await services.patients.create(
      patientCreateSchema.parse({
        firstName,
        lastName,
        gender,
        birthDate,
        phone,
        email: '',
        address: r.pick([
          'الجزائر العاصمة',
          'البليدة',
          'تيبازة',
          'بومرداس',
          'حي النصر',
          'باب الزوار',
          'الشراقة',
        ]),
        occupation: r.pick(OCCUPATIONS),
        chronicConditions: conditions,
        medicalNotes: conditions.includes('diabetes_t2')
          ? 'يتناول الميتفورمين. متابعة السكر مع الطبيب المعالج.'
          : '',
        allergies: r.chance(0.2) ? [r.pick(ALLERGIES)] : [],
        medications: conditions.includes('hypertension') ? ['أملوديبين'] : [],
        activityLevel: isFatima
          ? 'light'
          : r.pick(['sedentary', 'sedentary', 'light', 'light', 'moderate', 'active']),
        goal,
        targetWeightKg: target,
        statusOverride: stopped ? 'inactive' : null,
      }),
    );
    patientCount += 1;

    // ---- visits between 2026-08-01 and 2026-09-22 ----
    const first = isFatima ? '2026-08-11' : addDays('2026-08-01', r.int(0, 12));
    const last = isFatima ? '2026-09-22' : addDays('2026-09-22', -r.int(0, 9));
    const span = Math.max(visits - 1, 1);
    const whr = gender === 'female' ? r.range(0.78, 0.88) : r.range(0.86, 0.98);
    let lastMeasurement = null;
    for (let v = 0; v < visits; v++) {
      const date = openDay(
        addDays(first, Math.round(((Date.parse(last) - Date.parse(first)) / 864e5) * (v / span))),
      );
      const weightKg = roundTo(startWeight + perVisit * v + (isFatima ? 0 : r.range(-0.2, 0.2)), 1);
      const bmi = weightKg / (heightM * heightM);
      const age = ageOn(birthDate, date);
      const fat = roundTo(
        Math.max(8, 1.2 * bmi + 0.23 * age - (gender === 'male' ? 16.2 : 5.4)),
        1,
      );
      const waist = isFatima
        ? 82 + (visits - 1 - v) * 1.5
        : roundTo((gender === 'female' ? 0.75 : 0.9) * weightKg + 30, 0);
      const hip = isFatima ? 98 + (visits - 1 - v) * 1 : roundTo(waist / whr, 0);
      lastMeasurement = await services.measurements.create(
        patient.id,
        measurementCreateSchema.parse({
          date,
          weightKg,
          heightM,
          waistCm: waist,
          hipCm: hip,
          bodyFatPct: isFatima ? roundTo(28 + (visits - 1 - v) * 0.8, 1) : fat,
          muscleMassKg: null,
          visceralFat: null,
          waterPct: null,
          notes: '',
        }),
      );
      measurementCount += 1;
      // A completed appointment for most visits (some visits are walk-ins).
      if (r.chance(0.75)) {
        const time = slot(date);
        if (time) {
          await services.appointments.create(
            appointmentCreateSchema.parse({
              patientId: patient.id,
              date,
              time,
              durationMin: 30,
              type: v === 0 ? 'new_consultation' : 'follow_up',
              status: 'completed',
              notes: '',
            }),
          );
          appointmentCount += 1;
        }
      }
    }
    // A few missed appointments in the past.
    if (r.chance(0.15)) {
      const date = openDay(addDays(last, -r.int(3, 10)));
      const time = slot(date);
      if (time) {
        await services.appointments.create(
          appointmentCreateSchema.parse({
            patientId: patient.id,
            date,
            time,
            durationMin: 30,
            type: 'follow_up',
            status: 'no_show',
            notes: '',
          }),
        );
        appointmentCount += 1;
      }
    }

    // ---- diet plan ----
    if (!stopped && lastMeasurement && (isFatima || r.chance(0.85))) {
      const suggestion = suggestCalories({
        gender,
        weightKg: lastMeasurement.weightKg,
        heightM,
        age: ageOn(birthDate, today),
        activityLevel: patient.activityLevel,
        goal,
      });
      const dailyCalories = isFatima ? 1500 : suggestion.suggested;
      const kind = r.next();
      // Start dates spread so statuses vary: new plans, running plans, ended plans.
      const startDate = isFatima
        ? '2026-09-15'
        : kind < 0.2
          ? addDays(today, -r.int(0, 5))
          : kind < 0.85
            ? addDays(today, -r.int(10, 30))
            : addDays(today, -r.int(40, 60));
      const template = r.pick(MEAL_TEMPLATES);
      const baseKcal = template.reduce(
        (sum, [, , items]) =>
          sum +
          items.reduce((s, [name, q]) => {
            const f = /** @type {any} */ (foods.get(name));
            return s + (f.calories * q) / f.servingSize;
          }, 0),
        0,
      );
      const factor = dailyCalories / baseKcal;
      await services.dietPlans.create(
        dietPlanCreateSchema.parse({
          patientId: patient.id,
          title: `${{ weight_loss: 'خطة إنقاص الوزن', weight_gain: 'خطة زيادة الوزن', maintenance: 'خطة المحافظة على الوزن', therapeutic: 'خطة علاجية' }[goal]} — ${dailyCalories} سعرة`,
          goal,
          dailyCalories,
          macroTargets: { ...DEFAULT_MACROS[goal] },
          startDate,
          durationWeeks: 4,
          notes: 'شرب 1.5 إلى 2 لتر من الماء يومياً.',
          isTemplate: false,
          activate: true,
          days: [
            {
              day: 'daily',
              meals: template.map(([mealType, time, items]) => ({
                mealType,
                time,
                notes: '',
                items: items.map(([name, q]) => {
                  const f = /** @type {any} */ (foods.get(name));
                  return {
                    foodId: f.id,
                    quantity: roundQuantity(q * factor, f.servingUnit),
                    unit: f.servingUnit,
                  };
                }),
              })),
            },
          ],
        }),
      );
      planCount += 1;

      // Prescription for about a third of the patients with a plan.
      if (isFatima || index % 3 === 0) {
        const type =
          goal === 'therapeutic'
            ? conditions.includes('diabetes_t2')
              ? 'diabetic'
              : 'balanced'
            : goal === 'maintenance'
              ? 'balanced'
              : goal;
        const tpl = templateByType.get(type);
        if (tpl) {
          await services.prescriptions.create(
            prescriptionCreateSchema.parse({
              patientId: patient.id,
              templateId: tpl.id,
              dietPlanId: null,
              date: startDate <= today ? startDate : today,
            }),
          );
          prescriptionCount += 1;
        }
      }

      // Next follow-up in the coming two weeks.
      if (r.chance(0.7)) {
        const date = openDay(addDays(today, r.int(1, 14)));
        const time = slot(date);
        if (time) {
          await services.appointments.create(
            appointmentCreateSchema.parse({
              patientId: patient.id,
              date,
              time,
              durationMin: 30,
              type: r.pick(['follow_up', 'follow_up', 'measurement_only']),
              status: r.chance(0.6) ? 'confirmed' : 'pending',
              notes: '',
            }),
          );
          appointmentCount += 1;
        }
      }
    }
  }

  // ---- today's schedule (so the dashboard has "today" figures) ----
  const all = await repositories.patients.findAll({ archived: false });
  const todayOpen = weekdayOf(today) !== 5;
  if (todayOpen) {
    const hours =
      weekdayOf(today) === 6
        ? ['09:00', '10:00', '11:30', '12:00']
        : ['09:00', '10:30', '14:00', '15:30'];
    for (const [i, time] of hours.entries()) {
      const free = slot(today, time);
      if (!free) continue;
      await services.appointments.create(
        appointmentCreateSchema.parse({
          patientId: /** @type {any} */ (all[(i * 11 + 3) % all.length]).id,
          date: today,
          time: free,
          durationMin: 30,
          type: i === 0 ? 'new_consultation' : 'follow_up',
          status: i < 2 ? 'confirmed' : 'pending',
          notes: '',
        }),
      );
      appointmentCount += 1;
    }
  }

  await services.patients.refreshAllStatuses();
  const summary = {
    patients: patientCount,
    measurements: measurementCount,
    plans: planCount,
    appointments: appointmentCount,
    prescriptions: prescriptionCount,
    foods: foods.size,
    templates: templates.length,
  };
  log(`Seeded: ${JSON.stringify(summary)}`);
  return summary;
}
