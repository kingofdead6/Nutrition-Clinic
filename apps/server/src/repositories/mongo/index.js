import mongoose from 'mongoose';
import { createModels, ensureIndexes } from './models.js';
import { MongoAppointmentRepository } from './MongoAppointmentRepository.js';
import { MongoDietPlanRepository } from './MongoDietPlanRepository.js';
import { MongoFoodRepository } from './MongoFoodRepository.js';
import { MongoMeasurementRepository } from './MongoMeasurementRepository.js';
import { MongoPatientRepository } from './MongoPatientRepository.js';
import {
  MongoPrescriptionRepository,
  MongoPrescriptionTemplateRepository,
} from './MongoPrescriptionRepositories.js';
import { MongoSettingsRepository } from './MongoSettingsRepository.js';
import { MongoUserRepository } from './MongoUserRepository.js';

/**
 * Connects to MongoDB and returns the repository set. Uses a dedicated connection
 * (not the global mongoose one) so several instances can coexist, e.g. in tests.
 * This folder is the only place in the codebase that imports mongoose.
 *
 * @param {string} uri
 */
export async function createMongoRepositories(uri) {
  const conn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 });
  await conn.asPromise();

  const models = createModels(conn);
  await ensureIndexes(models);

  return {
    users: new MongoUserRepository(models.users),
    settings: new MongoSettingsRepository(models.settings),
    patients: new MongoPatientRepository(models),
    measurements: new MongoMeasurementRepository(models.measurements),
    appointments: new MongoAppointmentRepository(models.appointments),
    foods: new MongoFoodRepository(models.foods),
    dietPlans: new MongoDietPlanRepository(models.dietPlans),
    prescriptions: new MongoPrescriptionRepository(models.prescriptions),
    prescriptionTemplates: new MongoPrescriptionTemplateRepository(models.prescriptionTemplates),
    db: {
      driver: /** @type {const} */ ('mongo'),
      async ping() {
        try {
          await conn.db?.admin().ping();
          return conn.readyState === mongoose.ConnectionStates.connected;
        } catch {
          return false;
        }
      },
      close: () => conn.close(),
    },
  };
}
