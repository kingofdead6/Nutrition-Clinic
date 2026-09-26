import multer from 'multer';
import { UPLOAD_IMAGE_MIME_TYPES, UPLOAD_MAX_BYTES } from '@clinic/shared';
import { AppError } from './errors.js';

/**
 * Accepts one image in the multipart field `file`, kept in memory (max 2 MB).
 * The declared MIME type is only a first filter; `detectImage` checks the real bytes.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/** @type {readonly string[]} */ (UPLOAD_IMAGE_MIME_TYPES).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('UNSUPPORTED_MEDIA_TYPE', 'errors.imageType'));
    }
  },
}).single('file');

/** @typedef {{ ext: 'png' | 'jpg' | 'webp', mime: string }} ImageType */

/**
 * Identifies PNG / JPEG / WebP by magic bytes. SVG is deliberately not accepted
 * (it can carry scripts).
 * @param {Buffer} buf
 * @returns {ImageType | null}
 */
export function detectImage(buf) {
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

/** @type {Record<string, string>} */
const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

/** @param {string} key */
export function mimeForKey(key) {
  return MIME_BY_EXT[key.split('.').pop() ?? ''] ?? 'application/octet-stream';
}

/**
 * Returns the uploaded image or throws a client error.
 * @param {import('express').Request} req
 */
export function requireImage(req) {
  const file = req.file;
  if (!file) throw new AppError('VALIDATION_ERROR', 'errors.fileRequired');
  const type = detectImage(file.buffer);
  if (!type) throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'errors.imageType');
  return { buffer: file.buffer, ...type };
}
