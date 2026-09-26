import { readdir } from 'node:fs/promises';
import AdmZip from 'adm-zip';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, createTestApp, setupAdmin, TINY_PNG } from './helpers.js';

/** @type {Awaited<ReturnType<typeof createTestApp>>} */
let t;
/** @type {import('supertest').Agent} */
let admin;

beforeEach(async () => {
  t = await createTestApp();
  admin = await setupAdmin(t.app);
});
afterEach(() => t.repositories.db.close());

/** Collects a binary response body into a Buffer. @type {(res: any, cb: (err: Error | null, body: Buffer) => void) => void} */
const binary = (res, cb) => {
  /** @type {Buffer[]} */
  const chunks = [];
  res.on('data', (/** @type {Buffer} */ c) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

async function exportZip() {
  const res = await admin.get('/api/backup/export').buffer(true).parse(binary).expect(200);
  return /** @type {Buffer} */ (res.body);
}

/** @param {Buffer} zip @param {string} [query] */
const importZip = (zip, query = '') =>
  admin
    .post(`/api/backup/import${query}`)
    .attach('file', zip, { filename: 'backup.zip', contentType: 'application/zip' });

async function addPatientWithPhoto() {
  const p = await admin
    .post('/api/patients')
    .send({
      firstName: 'فاطمة',
      lastName: 'بن عيسى',
      gender: 'female',
      birthDate: '1994-03-10',
      phone: '0555123456',
      goal: 'weight_loss',
    })
    .expect(201);
  await admin
    .post(`/api/patients/${p.body.id}/photo`)
    .attach('file', TINY_PNG, { filename: 'p.png', contentType: 'image/png' })
    .expect(200);
  await admin
    .post(`/api/patients/${p.body.id}/measurements`)
    .send({ date: '2026-09-01', weightKg: 70, heightM: 1.65 })
    .expect(201);
  return p.body;
}

describe('/api/backup', () => {
  it('exports a zip with data.json (all collections) and the uploaded files', async () => {
    const patient = await addPatientWithPhoto();
    const zip = new AdmZip(await exportZip());
    const data = JSON.parse(zip.readAsText('data.json'));
    expect(data).toMatchObject({
      format: 'nutrition-clinic-backup',
      version: 1,
      dbDriver: 'mongo',
    });
    expect(data.collections.patients).toHaveLength(1);
    expect(data.collections.measurements).toHaveLength(1);
    expect(data.collections.users[0]).toMatchObject({
      email: ADMIN.email,
      passwordHash: expect.any(String),
    });
    expect(data.collections.foods.length).toBeGreaterThan(50);
    const photo = (await t.repositories.patients.findById(patient.id))?.photoPath;
    expect(zip.getEntry(`files/${photo}`)?.getData()).toEqual(TINY_PNG);
  });

  it('records the backup date and lists stored backups for download', async () => {
    expect((await admin.get('/api/backup/info').expect(200)).body).toEqual({
      lastBackupAt: null,
      backups: [],
    });
    await exportZip();
    const info = (await admin.get('/api/backup/info').expect(200)).body;
    expect(info.lastBackupAt).toEqual(expect.any(String));
    expect(info.backups).toHaveLength(1);
    expect(info.backups[0].name).toMatch(/^backup-\d{8}-\d{6}\.zip$/);
    await admin.get(`/api/backup/files/${info.backups[0].name}`).expect(200);
    await admin.get('/api/backup/files/..%2F.env').expect(404);
    await admin.get('/api/backup/files/backup-20200101-000000.zip').expect(404);
  });

  it('round-trips: restore brings back the same ids, files and passwords', async () => {
    const patient = await addPatientWithPhoto();
    const zipBuffer = await exportZip();
    const before = await t.repositories.patients.exportAll();

    // Change things after the backup.
    await admin
      .post('/api/patients')
      .send({
        firstName: 'أحمد',
        lastName: 'سعيد',
        gender: 'male',
        birthDate: '1990-01-01',
        phone: '0661000000',
        goal: 'maintenance',
      })
      .expect(201);
    await admin.delete(`/api/patients/${patient.id}/photo`).expect(200);

    const res = await importZip(zipBuffer, '?confirm=true').expect(200);
    expect(res.body).toMatchObject({
      dryRun: false,
      counts: { patients: 1, measurements: 1, users: 1 },
      files: 1,
    });
    expect(res.body.safetyBackup).toMatch(/-pre-restore\.zip$/);

    expect(await t.repositories.patients.exportAll()).toEqual(before);
    const photo = await admin.get(`/api/patients/${patient.id}/photo`).expect(200);
    expect(Buffer.from(photo.body)).toEqual(TINY_PNG);
    // The restored data remembers when its backup was taken.
    const info = (await admin.get('/api/backup/info').expect(200)).body;
    expect(info.lastBackupAt).toBe(res.body.createdAt);
    await request(t.app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password })
      .expect(200);
  });

  it('a dry run reports the contents and changes nothing', async () => {
    await addPatientWithPhoto();
    const zipBuffer = await exportZip();
    await t.repositories.patients.importAll([]);
    const res = await importZip(zipBuffer, '?dryRun=true').expect(200);
    expect(res.body).toMatchObject({
      dryRun: true,
      safetyBackup: null,
      counts: { patients: 1 },
      files: 1,
    });
    expect(await t.repositories.patients.count()).toBe(0);
  });

  it('refuses a real import without confirm', async () => {
    const res = await importZip(await exportZip()).expect(400);
    expect(res.body.error.message).toBe('errors.backupConfirm');
  });

  it('rejects files that are not valid backups, before touching the data', async () => {
    await addPatientWithPhoto();
    const notZip = await importZip(Buffer.from('hello'), '?confirm=true').expect(400);
    expect(notZip.body.error.message).toBe('errors.backupInvalid');

    const other = new AdmZip();
    other.addFile('data.json', Buffer.from(JSON.stringify({ format: 'something-else' })));
    expect(
      (await importZip(other.toBuffer(), '?confirm=true').expect(400)).body.error.message,
    ).toBe('errors.backupInvalid');

    const zip = new AdmZip(await exportZip());
    const data = JSON.parse(zip.readAsText('data.json'));

    const newer = new AdmZip();
    newer.addFile('data.json', Buffer.from(JSON.stringify({ ...data, version: 99 })));
    expect(
      (await importZip(newer.toBuffer(), '?confirm=true').expect(400)).body.error.message,
    ).toBe('errors.backupNewer');

    data.collections.patients[0].gender = 'unknown';
    const broken = new AdmZip();
    broken.addFile('data.json', Buffer.from(JSON.stringify(data)));
    const bad = await importZip(broken.toBuffer(), '?confirm=true').expect(400);
    expect(bad.body.error).toMatchObject({
      message: 'errors.backupInvalidRecords',
      details: [expect.objectContaining({ collection: 'patients', index: 0, path: 'gender' })],
    });

    data.collections.patients[0].gender = 'female';
    data.collections.users = [];
    const noAdmin = new AdmZip();
    noAdmin.addFile('data.json', Buffer.from(JSON.stringify(data)));
    expect(
      (await importZip(noAdmin.toBuffer(), '?confirm=true').expect(400)).body.error.message,
    ).toBe('errors.backupNoAdmin');

    expect(await t.repositories.patients.count()).toBe(1);
    const res = await admin
      .post('/api/backup/import')
      .attach('file', Buffer.from('x'), 'notes.txt')
      .expect(415);
    expect(res.body.error.message).toBe('errors.backupType');
  });

  it('is admin only', async () => {
    await admin
      .post('/api/users')
      .send({
        name: 'Nour',
        email: 'nour@clinic.local',
        password: 'password123',
        role: 'nutritionist',
      })
      .expect(201);
    const other = request.agent(t.app);
    await other
      .post('/api/auth/login')
      .send({ email: 'nour@clinic.local', password: 'password123' })
      .expect(200);
    await other.get('/api/backup/info').expect(403);
    await other.get('/api/backup/export').expect(403);
    await request(t.app).get('/api/backup/info').expect(401);
  });

  it('keeps a safety copy of the replaced data', async () => {
    await addPatientWithPhoto();
    const zipBuffer = await exportZip();
    await importZip(zipBuffer, '?confirm=true').expect(200);
    const names = await readdir(t.config.paths.backupDir);
    expect(names.filter((n) => n.endsWith('-pre-restore.zip'))).toHaveLength(1);
  });
});
