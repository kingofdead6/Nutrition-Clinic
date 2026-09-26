// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/**
 * Prescription bodies are a small, safe subset of HTML. The same allowlist is enforced
 * on the server (on save) and in the browser (before rendering).
 */
export declare const RICH_TEXT_TAGS: readonly [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h3',
  'h4',
];
export declare function escapeHtml(value: string): string;
/**
 * Replaces `{{name}}` tokens. Values are HTML-escaped (a patient called `<b>x</b>`
 * stays text). Unknown or empty tokens become `—` so a printed document never shows
 * raw braces.
 */
export declare function fillPlaceholders(
  template: string,
  values: Record<string, string | number | null | undefined>,
): string;
/** Placeholder names used in a template (for the editor's help panel and validation). */
export declare function placeholdersIn(template: string): string[];
