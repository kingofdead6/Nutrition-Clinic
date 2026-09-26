/**
 * File storage abstraction for patient photos, the clinic logo and generated exports.
 * Keys are relative, forward-slash paths such as `patients/<uuid>.jpg`.
 * The only implementation is LocalFileStorage (same on web and desktop); no cloud storage.
 *
 * @typedef {object} StorageAdapter
 * @property {(key: string, data: Buffer) => Promise<{ key: string, size: number }>} save
 * @property {(key: string) => Promise<Buffer>} read
 * @property {(key: string) => Promise<boolean>} exists
 * @property {(key: string) => Promise<void>} delete
 * @property {(key: string) => string} getPath  Absolute path on disk (streaming, backups, Electron).
 * @property {(prefix?: string) => Promise<string[]>} list  All keys under an optional prefix (backup).
 */

export const STORAGE_ADAPTER_METHODS = Object.freeze([
  'save',
  'read',
  'exists',
  'delete',
  'getPath',
  'list',
]);
