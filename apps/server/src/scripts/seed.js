/**
 * `npm run seed` — fills an EMPTY database with the demo clinic.
 * `npm run seed -- --force` wipes the configured database first (asks nothing: be sure
 * of your MONGO_URI / DATA_DIR).
 */
import 'dotenv/config';
import { SEED_ADMIN, seedDatabase } from '../seed/seedDatabase.js';
import { describeDatabase, openRuntime } from './runtime.js';

const force = process.argv.includes('--force');
const rt = await openRuntime();
console.log(`Seeding ${describeDatabase(rt.config)} …`);
try {
  const summary = await seedDatabase({ ...rt, reset: force, log: (m) => console.log(`  ${m}`) });
  console.log('\nDone:', summary);
  console.log(`\nSign in with ${SEED_ADMIN.email} / ${SEED_ADMIN.password}`);
  console.warn(
    '⚠  WARNING: this is a well-known demo password. Change it (profile menu → الملف الشخصي) before real use.',
  );
} catch (err) {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
} finally {
  await rt.close();
}
