/**
 * Command-line backup/restore, using the same code as the API (no server needed):
 *
 *   npm run backup -- export                     → writes a zip into BACKUP_DIR
 *   npm run backup -- import <file.zip> --dry-run → shows what the archive contains
 *   npm run backup -- import <file.zip> --yes     → REPLACES all data (a safety backup is taken first)
 *
 * This is also the Mongo → SQLite migration path: export with DB_DRIVER=mongo, then
 * import with DB_DRIVER=sqlite.
 */
import 'dotenv/config';
import { describeDatabase, openRuntime } from './runtime.js';

const [command, file] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dryRun = process.argv.includes('--dry-run');
const yes = process.argv.includes('--yes');

if (command !== 'export' && command !== 'import') {
  console.log('Usage: npm run backup -- export | import <file.zip> [--dry-run | --yes]');
  process.exit(1);
}
if (command === 'import' && !file) {
  console.error('Missing archive path.');
  process.exit(1);
}

const rt = await openRuntime();
console.log(`Database: ${describeDatabase(rt.config)}`);
try {
  if (command === 'export') {
    const { path } = await rt.services.backup.exportBackup();
    console.log(`Backup written: ${path}`);
  } else {
    const buffer = await rt.services.backup.readFile(/** @type {string} */ (file));
    if (!dryRun && !yes) {
      const preview = await rt.services.backup.importBackup(buffer, {
        dryRun: true,
        confirm: false,
      });
      console.log('Archive contents:', preview.counts, `files: ${preview.files}`);
      console.log(
        '\nThis REPLACES every record in the database above. Re-run with --yes to restore.',
      );
    } else {
      const result = await rt.services.backup.importBackup(buffer, { dryRun, confirm: yes });
      console.log(dryRun ? 'Dry run:' : 'Restored:', result.counts, `files: ${result.files}`);
      if (result.safetyBackup) console.log(`Previous data saved as ${result.safetyBackup}`);
    }
  }
} catch (err) {
  const details = /** @type {any} */ (err)?.details;
  console.error(
    `✗ ${err instanceof Error ? err.message : String(err)}`,
    details ? JSON.stringify(details, null, 1) : '',
  );
  process.exitCode = 1;
} finally {
  await rt.close();
}
