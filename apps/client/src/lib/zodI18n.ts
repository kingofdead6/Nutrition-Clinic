import { z } from 'zod';

/**
 * Global zod error map: turns built-in issues into i18n keys, optionally followed by
 * `|{json params}` (e.g. `validation.tooShort|{"min":8}`). Schema-level messages
 * (already `validation.*` keys) take precedence and are left alone.
 * `translateMessage()` (lib/errors.ts) renders both forms.
 */
const withParams = (key: string, params: Record<string, unknown>) =>
  `${key}|${JSON.stringify(params)}`;

const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || Number.isNaN(v);

export function installZodI18n() {
  z.config({
    customError: (issue) => {
      switch (issue.code) {
        case 'too_small':
          if (issue.origin === 'string') {
            return Number(issue.minimum) <= 1
              ? 'validation.required'
              : withParams('validation.tooShort', { min: Number(issue.minimum) });
          }
          if (issue.origin === 'array' || issue.origin === 'set') return 'validation.required';
          return withParams('validation.tooSmall', { min: Number(issue.minimum) });
        case 'too_big':
          if (issue.origin === 'string') {
            return withParams('validation.tooLong', { max: Number(issue.maximum) });
          }
          return withParams('validation.tooBig', { max: Number(issue.maximum) });
        case 'invalid_type':
          if (isEmpty(issue.input)) return 'validation.required';
          return issue.expected === 'number' ? 'validation.number' : 'validation.invalid';
        case 'invalid_format':
          if (issue.format === 'email') return 'validation.email';
          if (issue.format === 'date') return 'validation.date';
          if (issue.format === 'datetime') return 'validation.dateTime';
          return 'validation.invalid';
        case 'invalid_value':
          return isEmpty(issue.input) ? 'validation.required' : 'validation.invalid';
        default:
          return 'validation.invalid';
      }
    },
  });
}
