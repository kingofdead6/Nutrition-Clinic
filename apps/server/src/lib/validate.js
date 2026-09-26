/**
 * Request parsing helpers. Each throws a ZodError on invalid input, which the central
 * error handler turns into a 400 VALIDATION_ERROR. (Express 5 makes `req.query`
 * read-only, so parsed values are returned instead of written back onto `req`.)
 */

/**
 * @template {import('zod').ZodType} S
 * @param {import('express').Request} req
 * @param {S} schema
 * @returns {import('zod').output<S>}
 */
export const parseBody = (req, schema) => schema.parse(req.body ?? {});

/**
 * @template {import('zod').ZodType} S
 * @param {import('express').Request} req
 * @param {S} schema
 * @returns {import('zod').output<S>}
 */
export const parseQuery = (req, schema) => schema.parse(req.query);

/**
 * @template {import('zod').ZodType} S
 * @param {import('express').Request} req
 * @param {S} schema
 * @returns {import('zod').output<S>}
 */
export const parseParams = (req, schema) => schema.parse(req.params);
