import { promises as fs } from 'node:fs';
import path from 'node:path';

const KEY_PATTERN = /^[A-Za-z0-9_-][A-Za-z0-9._/-]*$/;

/**
 * Stores files under a root folder (the configured uploads dir inside DATA_DIR).
 * @implements {import('./StorageAdapter.js').StorageAdapter}
 */
export class LocalFileStorage {
  /** @param {string} rootDir */
  constructor(rootDir) {
    this.root = path.resolve(rootDir);
  }

  /** @param {string} key */
  getPath(key) {
    if (!KEY_PATTERN.test(key) || key.split('/').includes('..')) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    const full = path.resolve(this.root, ...key.split('/'));
    if (full !== this.root && !full.startsWith(this.root + path.sep)) {
      throw new Error(`Storage key escapes root: ${key}`);
    }
    return full;
  }

  /** @param {string} key @param {Buffer} data */
  async save(key, data) {
    const full = this.getPath(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    // Write to a temp file first so a crash never leaves a half-written file behind.
    const tmp = `${full}.${process.pid}.tmp`;
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, full);
    return { key, size: data.byteLength };
  }

  /** @param {string} key */
  read(key) {
    return fs.readFile(this.getPath(key));
  }

  /** @param {string} key */
  async exists(key) {
    try {
      await fs.access(this.getPath(key));
      return true;
    } catch {
      return false;
    }
  }

  /** @param {string} key */
  async delete(key) {
    await fs.rm(this.getPath(key), { force: true });
  }

  /** @param {string} [prefix] */
  async list(prefix = '') {
    const start = prefix ? this.getPath(prefix.replace(/\/+$/, '')) : this.root;
    /** @type {string[]} */
    const keys = [];
    /** @param {string} dir */
    const walk = async (dir) => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (!entry.name.endsWith('.tmp')) {
          keys.push(path.relative(this.root, full).split(path.sep).join('/'));
        }
      }
    };
    await walk(start);
    return keys.sort();
  }
}
