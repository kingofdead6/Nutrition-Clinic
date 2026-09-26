import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { DuplicateKeyError } from '../repositories/errors.js';

/** @typedef {import('#shared').ApiErrorBody} ApiErrorBody */

/**
 * Maps any thrown value to an HTTP status and the standard error body.
 * @param {unknown} err
 * @returns {{ status: number, body: ApiErrorBody }}
 */
export function toErrorResponse(err) {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, details: err.details } },
    };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'errors.validation',
          details: err.issues.map((i) => ({
            path: i.path.join('.'),
            code: i.code,
            message: i.message,
          })),
        },
      },
    };
  }
  if (err instanceof DuplicateKeyError) {
    return {
      status: 409,
      body: { error: { code: 'CONFLICT', message: 'errors.duplicate', details: { key: err.key } } },
    };
  }
  if (err && typeof err === 'object' && 'name' in err && err.name === 'MulterError') {
    const { code } = /** @type {{ code?: string }} */ (err);
    return code === 'LIMIT_FILE_SIZE'
      ? {
          status: 413,
          body: { error: { code: 'PAYLOAD_TOO_LARGE', message: 'errors.fileTooLarge' } },
        }
      : { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: 'errors.upload' } } };
  }
  if (err && typeof err === 'object') {
    const { type, status } = /** @type {{ type?: string, status?: number }} */ (err);
    if (type === 'entity.parse.failed') {
      return {
        status: 400,
        body: { error: { code: 'VALIDATION_ERROR', message: 'errors.invalidJson' } },
      };
    }
    if (type === 'entity.too.large' || status === 413) {
      return {
        status: 413,
        body: { error: { code: 'PAYLOAD_TOO_LARGE', message: 'errors.tooLarge' } },
      };
    }
  }
  return { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'errors.internal' } } };
}

/**
 * Central error handler: every error leaves the API as `{ error: { code, message, details? } }`.
 * @param {import('../lib/logger.js').Logger} logger
 * @returns {import('express').ErrorRequestHandler}
 */
export function errorHandler(logger) {
  return (err, req, res, next) => {
    if (res.headersSent) return next(err);
    const { status, body } = toErrorResponse(err);
    if (status >= 500) (req.log ?? logger).error({ err }, 'Unhandled error');
    res.status(status).json(body);
  };
}

/** @type {import('express').RequestHandler} */
export const apiNotFound = (_req, res) => {
  /** @type {ApiErrorBody} */
  const body = { error: { code: 'NOT_FOUND', message: 'errors.routeNotFound' } };
  res.status(404).json(body);
};
