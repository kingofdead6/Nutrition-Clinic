/**
 * Driver-agnostic storage errors. Drivers translate their native errors into these
 * so services and the HTTP layer never depend on a specific database.
 */
export class DuplicateKeyError extends Error {
  /** @param {string} key */
  constructor(key) {
    super(`Duplicate value for unique key: ${key}`);
    this.name = 'DuplicateKeyError';
    this.key = key;
  }
}
