import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Picks up MONGOMS_SYSTEM_BINARY so mongodb-memory-server uses the installed mongod.
loadEnv({ quiet: true });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    globalSetup: ['./test/globalSetup.js'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: { NODE_ENV: 'test' },
  },
});
