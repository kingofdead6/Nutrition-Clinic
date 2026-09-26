import { AppError, conflict } from '../lib/errors.js';
import { hashPassword, verifyAgainstDummy, verifyPassword } from '../lib/password.js';
import { logoUrlFor } from './settingsService.js';

/**
 * @param {import('../context.js').AppContext} ctx
 * @param {{
 *   settings: import('./settingsService.js').SettingsService,
 *   foods: import('./foodService.js').FoodService,
 *   prescriptions: import('./prescriptionService.js').PrescriptionService,
 * }} deps
 */
export function createAuthService({ repositories, config }, { settings, foods, prescriptions }) {
  const users = repositories.users;
  const rounds = config.auth.bcryptRounds;

  return {
    /** @returns {Promise<import('@clinic/shared').AuthStatus>} */
    async status() {
      const [userCount, s] = await Promise.all([users.count(), settings.get()]);
      return {
        setupRequired: userCount === 0,
        clinic: {
          clinicName: s.clinicName,
          tagline: s.tagline,
          practitionerTitle: s.practitionerTitle,
          timezone: s.timezone,
          locale: s.locale,
          logoUrl: logoUrlFor(s),
        },
      };
    },

    /**
     * First run only: creates the admin and the clinic settings.
     * @param {import('@clinic/shared').SetupInput} input
     */
    async setup(input) {
      if ((await users.count()) > 0) throw conflict('errors.setupDone');
      const admin = await users.create({
        name: input.admin.name,
        email: input.admin.email,
        role: 'admin',
        isActive: true,
        passwordHash: await hashPassword(input.admin.password, rounds),
        tokenVersion: 0,
      });
      await settings.update(input.clinic);
      // A new clinic starts with the starter food database (if it has no foods yet).
      if ((await repositories.foods.count()) === 0) await foods.installDefaults();
      if ((await repositories.prescriptionTemplates.count()) === 0) {
        await prescriptions.installDefaultTemplates();
      }
      return admin;
    },

    /**
     * @param {import('@clinic/shared').LoginInput} input
     * @returns {Promise<import('../repositories/interfaces/UserRepository.js').UserRecord>}
     */
    async login(input) {
      const record = await users.findByEmail(input.email);
      const ok = record
        ? await verifyPassword(input.password, record.passwordHash)
        : await verifyAgainstDummy(input.password, rounds);
      if (!record || !ok) throw new AppError('UNAUTHENTICATED', 'errors.invalidCredentials');
      if (!record.isActive) throw new AppError('FORBIDDEN', 'errors.accountDisabled');
      return record;
    },
  };
}

/** @typedef {ReturnType<typeof createAuthService>} AuthService */
