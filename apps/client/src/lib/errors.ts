import type { TFunction } from 'i18next';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './apiClient';

/**
 * Renders a message that may be an i18n key (`validation.*` / `errors.*`), optionally
 * with `|{json params}`, as produced by the zod error map and the API.
 */
export function translateMessage(t: TFunction, message: string | undefined): string {
  if (!message) return '';
  const [key = '', rawParams] = message.split('|', 2);
  if (!/^(validation|errors)\./.test(key)) return message;
  let params: Record<string, unknown> = {};
  if (rawParams) {
    try {
      params = JSON.parse(rawParams) as Record<string, unknown>;
    } catch {
      /* ignore malformed params */
    }
  }
  const translated = t(key as 'errors.generic', { ...params, defaultValue: '' });
  return translated || t('errors.generic');
}

/** User-facing text for any error thrown by a query or mutation. */
export function errorText(t: TFunction, error: unknown): string {
  if (error instanceof ApiError) return translateMessage(t, error.message) || t('errors.generic');
  return t('errors.generic');
}

const FIELD_BY_ERROR: Record<string, string> = {
  'errors.emailTaken': 'email',
};

interface FieldIssue {
  path: string;
  message: string;
}

const isFieldIssues = (v: unknown): v is FieldIssue[] =>
  Array.isArray(v) &&
  v.every((d) => typeof d === 'object' && d !== null && 'path' in d && 'message' in d);

/**
 * Copies server-side validation issues onto react-hook-form fields.
 * Returns true if at least one field error was applied.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!(error instanceof ApiError)) return false;
  // Errors the server reports without field details but that clearly belong to one field.
  const field = FIELD_BY_ERROR[error.message];
  if (field) {
    setError(field as Path<T>, { type: 'server', message: error.message });
    return true;
  }
  if (!isFieldIssues(error.details)) return false;
  for (const issue of error.details) {
    if (issue.path) setError(issue.path as Path<T>, { type: 'server', message: issue.message });
  }
  return error.details.length > 0;
}
