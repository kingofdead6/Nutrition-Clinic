import { createAppointmentService } from './appointmentService.js';
import { createAuthService } from './authService.js';
import { createBackupService } from './backupService.js';
import { createDashboardService } from './dashboardService.js';
import { createDietPlanService } from './dietPlanService.js';
import { createFoodService } from './foodService.js';
import { createMeasurementService } from './measurementService.js';
import { createPatientService } from './patientService.js';
import { createPrescriptionService } from './prescriptionService.js';
import { createReportService } from './reportService.js';
import { createSettingsService } from './settingsService.js';
import { createUserService } from './userService.js';

/**
 * Builds every service once per app. Services hold the business rules and depend only
 * on the repository interfaces, storage and config in the context.
 * @param {import('../context.js').AppContext} ctx
 */
export function createServices(ctx) {
  const settings = createSettingsService(ctx);
  const users = createUserService(ctx);
  const foods = createFoodService(ctx);
  const prescriptions = createPrescriptionService(ctx, { settings });
  const auth = createAuthService(ctx, { settings, foods, prescriptions });
  const patients = createPatientService(ctx, { settings });
  const measurements = createMeasurementService(ctx, { settings, patients });
  const appointments = createAppointmentService(ctx, { settings, patients });
  const dashboard = createDashboardService(ctx, { settings });
  const dietPlans = createDietPlanService(ctx, { patients });
  const reports = createReportService(ctx, { settings });
  const backup = createBackupService(ctx, { patients });
  return {
    settings,
    users,
    auth,
    patients,
    measurements,
    appointments,
    dashboard,
    foods,
    dietPlans,
    prescriptions,
    reports,
    backup,
  };
}

/** @typedef {ReturnType<typeof createServices>} Services */
