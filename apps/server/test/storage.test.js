import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { LocalFileStorage } from '../src/storage/LocalFileStorage.js';

describe('LocalFileStorage', () => {
  const root = path.join(os.tmpdir(), `clinic-storage-${randomUUID()}`);
  const storage = new LocalFileStorage(root);
  afterAll(() => rm(root, { recursive: true, force: true }));

  it('saves, reads, lists and deletes', async () => {
    await storage.save('patients/a.jpg', Buffer.from('A'));
    await storage.save('logo/logo.png', Buffer.from('LOGO'));
    expect((await storage.read('patients/a.jpg')).toString()).toBe('A');
    expect(await storage.list()).toEqual(['logo/logo.png', 'patients/a.jpg']);
    expect(await storage.list('patients')).toEqual(['patients/a.jpg']);
    expect(storage.getPath('patients/a.jpg')).toBe(path.join(root, 'patients', 'a.jpg'));
    await storage.delete('patients/a.jpg');
    expect(await storage.exists('patients/a.jpg')).toBe(false);
    await expect(storage.delete('patients/a.jpg')).resolves.toBeUndefined();
  });

  it.each(['../escape.txt', 'a/../../b', '/abs/path', 'C:/win', 'a\\b'])(
    'rejects unsafe key %s',
    (key) => {
      expect(() => storage.getPath(key)).toThrow();
    },
  );
});
