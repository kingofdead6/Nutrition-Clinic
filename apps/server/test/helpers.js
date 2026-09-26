import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { inject } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { assertRepositories } from '../src/repositories/index.js';
import { createMongoRepositories } from '../src/repositories/mongo/index.js';

/** A fresh, empty Mongo database on the shared in-memory server. */
export async function createTestMongoRepositories() {
  const url = new URL(inject('mongoUri'));
  url.pathname = `/test_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
  return assertRepositories(await createMongoRepositories(url.toString()));
}

/** @param {Record<string, string>} [overrides] */
export function createTestConfig(overrides = {}) {
  const dataDir = path.join(os.tmpdir(), `clinic-test-${randomUUID()}`);
  return loadConfig({ NODE_ENV: 'test', DATA_DIR: dataDir, BCRYPT_ROUNDS: '4', ...overrides });
}

/**
 * @param {Partial<import('../src/repositories/interfaces/common.js').NewEntity<import('#shared').Patient>>} [overrides]
 * @returns {import('../src/repositories/interfaces/common.js').NewEntity<import('#shared').Patient>}
 */
export function patientFixture(overrides = {}) {
  const firstName = overrides.firstName ?? 'فاطمة';
  const lastName = overrides.lastName ?? 'بن عيسى';
  return {
    fileNumber: 'P-0001',
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender: 'female',
    birthDate: '1994-03-10',
    phone: '0555123456',
    email: '',
    address: '',
    occupation: '',
    photoPath: null,
    chronicConditions: [],
    medicalNotes: '',
    allergies: [],
    medications: [],
    activityLevel: 'light',
    goal: 'weight_loss',
    targetWeightKg: 62,
    status: 'follow_up',
    statusOverride: null,
    archived: false,
    lastVisitDate: null,
    ...overrides,
  };
}

/**
 * A full app on a fresh database. Close `repositories` in afterAll/afterEach.
 * @param {Record<string, string>} [configOverrides]
 * @param {{ now?: () => Date }} [options]  pin the clock for time-dependent tests
 */
export async function createTestApp(configOverrides = {}, options = {}) {
  const repositories = await createTestMongoRepositories();
  const config = createTestConfig(configOverrides);
  const app = createApp({ repositories, config, now: options.now });
  return { app, repositories, config };
}

export const ADMIN = { name: 'Admin', email: 'admin@clinic.local', password: 'admin12345' };

/**
 * Runs first-run setup and returns an agent that carries the admin's session cookie.
 * @param {import('express').Express} app
 */
export async function setupAdmin(app) {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/setup')
    .send({ admin: ADMIN, clinic: { clinicName: 'عيادة الاختبار', practitionerName: 'د. سارة' } })
    .expect(201);
  return agent;
}

/** A 1×1 transparent PNG. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
