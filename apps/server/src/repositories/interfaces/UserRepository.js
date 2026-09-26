import { CRUD_METHODS } from './common.js';

/**
 * Server-side user record. Never serialize this; map to `User` first (toPublicUser).
 * `tokenVersion` is bumped to revoke existing sessions (password change, deactivation).
 * @typedef {import('#shared').User & { passwordHash: string, tokenVersion: number }} UserRecord
 */

/**
 * @typedef {import('./common.js').CrudRepository<UserRecord> & {
 *   findByEmail(email: string): Promise<UserRecord | null>,
 *   listAll(): Promise<UserRecord[]>,
 * }} UserRepository
 */

export const USER_REPOSITORY_METHODS = Object.freeze([...CRUD_METHODS, 'findByEmail', 'listAll']);
