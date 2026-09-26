/** @typedef {import('@clinic/shared').ErrorCode} ErrorCode */

/** @type {Record<ErrorCode, number>} */
const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
};

/**
 * An expected, client-facing error. `message` is an i18n key (`errors.*`) or a short
 * English fallback; the client translates by `code` and `message`.
 */
export class AppError extends Error {
  /**
   * @param {ErrorCode} code
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(code, message, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.status = STATUS_BY_CODE[code];
  }
}

/** @param {string} entity */
export const notFound = (entity) => new AppError('NOT_FOUND', `errors.notFound.${entity}`);
/** @param {string} message @param {unknown} [details] */
export const conflict = (message, details) => new AppError('CONFLICT', message, details);
export const forbidden = () => new AppError('FORBIDDEN', 'errors.forbidden');
export const unauthenticated = () => new AppError('UNAUTHENTICATED', 'errors.unauthenticated');
/** @param {string} what */
export const notImplemented = (what) =>
  new AppError('NOT_IMPLEMENTED', `${what} is not implemented yet`);

/**
 * A validation error attached to one field, shaped like zod issues so the client
 * shows it under that input.
 * @param {string} path
 * @param {string} message  i18n key
 */
export const fieldError = (path, message) =>
  new AppError('VALIDATION_ERROR', 'errors.validation', [{ path, code: 'custom', message }]);
