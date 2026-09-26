import { MongoMemoryServer } from 'mongodb-memory-server';

/** @type {MongoMemoryServer | undefined} */
let mongod;

/**
 * One in-memory mongod for the whole run; each test uses its own database on it.
 * @param {import('vitest/node').TestProject} project
 */
export async function setup(project) {
  mongod = await MongoMemoryServer.create();
  project.provide('mongoUri', mongod.getUri());
}

export async function teardown() {
  await mongod?.stop();
}
