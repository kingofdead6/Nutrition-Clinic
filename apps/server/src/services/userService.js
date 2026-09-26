import { AppError, conflict, notFound } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { DuplicateKeyError } from '../repositories/errors.js';

/** @typedef {import('#shared').User} User */
/** @typedef {import('../repositories/interfaces/UserRepository.js').UserRecord} UserRecord */

/**
 * Strips server-only fields. Every user that leaves the server goes through this.
 * @param {UserRecord} record
 * @returns {User}
 */
export function toPublicUser(record) {
  const { id, name, email, role, isActive, createdAt, updatedAt } = record;
  return { id, name, email, role, isActive, createdAt, updatedAt };
}

/**
 * @template R
 * @param {() => Promise<R>} op
 */
async function withEmailUniqueness(op) {
  try {
    return await op();
  } catch (err) {
    if (err instanceof DuplicateKeyError) throw conflict('errors.emailTaken');
    throw err;
  }
}

/** @param {import('../context.js').AppContext} ctx */
export function createUserService({ repositories, config }) {
  const users = repositories.users;
  const rounds = config.auth.bcryptRounds;

  /** @param {string} id */
  async function getRecord(id) {
    const record = await users.findById(id);
    if (!record) throw notFound('user');
    return record;
  }

  /**
   * Refuses changes that would leave the clinic without an active admin.
   * @param {UserRecord} target
   * @param {{ role?: string, isActive?: boolean, deleting?: boolean }} change
   */
  async function assertKeepsAnAdmin(target, change) {
    const wasActiveAdmin = target.role === 'admin' && target.isActive;
    const staysActiveAdmin =
      !change.deleting &&
      (change.role ?? target.role) === 'admin' &&
      (change.isActive ?? target.isActive);
    if (!wasActiveAdmin || staysActiveAdmin) return;
    const activeAdmins = (await users.listAll()).filter((u) => u.role === 'admin' && u.isActive);
    if (activeAdmins.length <= 1) throw conflict('errors.lastAdmin');
  }

  return {
    async list() {
      return (await users.listAll()).map(toPublicUser);
    },

    /** @param {import('#shared').UserCreateInput} input */
    async create(input) {
      const { password, ...rest } = input;
      const record = await withEmailUniqueness(async () =>
        users.create({
          ...rest,
          passwordHash: await hashPassword(password, rounds),
          tokenVersion: 0,
        }),
      );
      return toPublicUser(record);
    },

    /**
     * @param {User} actor
     * @param {string} id
     * @param {import('#shared').UserUpdateInput} patch
     */
    async update(actor, id, patch) {
      const target = await getRecord(id);
      if (actor.id === id && patch.isActive === false) {
        throw new AppError('CONFLICT', 'errors.cannotDisableSelf');
      }
      await assertKeepsAnAdmin(target, patch);

      const { password, ...rest } = patch;
      /** @type {Partial<UserRecord>} */
      const changes = { ...rest };
      const revokeSessions = password !== undefined || patch.isActive === false;
      if (password !== undefined) changes.passwordHash = await hashPassword(password, rounds);
      if (revokeSessions) changes.tokenVersion = (target.tokenVersion ?? 0) + 1;

      const updated = await withEmailUniqueness(() => users.update(id, changes));
      if (!updated) throw notFound('user');
      return toPublicUser(updated);
    },

    /** @param {User} actor @param {string} id */
    async remove(actor, id) {
      if (actor.id === id) throw new AppError('CONFLICT', 'errors.cannotDeleteSelf');
      const target = await getRecord(id);
      await assertKeepsAnAdmin(target, { deleting: true });
      await users.delete(id);
    },

    /**
     * @param {string} id
     * @param {import('#shared').ProfileUpdateInput} input
     */
    async updateProfile(id, input) {
      const updated = await withEmailUniqueness(() => users.update(id, input));
      if (!updated) throw notFound('user');
      return toPublicUser(updated);
    },

    /**
     * Changes the caller's own password and revokes their other sessions.
     * Returns the updated record so the route can issue a fresh cookie.
     * @param {string} id
     * @param {{ currentPassword: string, newPassword: string }} input
     */
    async changePassword(id, input) {
      const record = await getRecord(id);
      if (!(await verifyPassword(input.currentPassword, record.passwordHash))) {
        throw new AppError('VALIDATION_ERROR', 'errors.wrongPassword', [
          { path: 'currentPassword', code: 'custom', message: 'errors.wrongPassword' },
        ]);
      }
      const updated = await users.update(id, {
        passwordHash: await hashPassword(input.newPassword, rounds),
        tokenVersion: (record.tokenVersion ?? 0) + 1,
      });
      if (!updated) throw notFound('user');
      return updated;
    },
  };
}

/** @typedef {ReturnType<typeof createUserService>} UserService */
