import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

/** @param {string} password @param {number} rounds */
export function hashPassword(password, rounds) {
  return bcrypt.hash(password, rounds);
}

/** @param {string} password @param {string} hash */
export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** @type {Promise<string> | undefined} */
let dummyHash;

/**
 * Burns the same bcrypt time as a real check. Used when the email is unknown, so a failed
 * login takes as long whether or not the account exists (no user enumeration by timing).
 * @param {string} password
 * @param {number} rounds
 */
export async function verifyAgainstDummy(password, rounds) {
  dummyHash ??= bcrypt.hash(randomUUID(), rounds);
  await bcrypt.compare(password, await dummyHash);
  return false;
}
