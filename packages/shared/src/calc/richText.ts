/**
 * Prescription bodies are a small, safe subset of HTML. The same allowlist is enforced
 * on the server (on save) and in the browser (before rendering).
 */
export const RICH_TEXT_TAGS = [
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
] as const;

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

const PLACEHOLDER = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

/**
 * Replaces `{{name}}` tokens. Values are HTML-escaped (a patient called `<b>x</b>`
 * stays text). Unknown or empty tokens become `—` so a printed document never shows
 * raw braces.
 */
export function fillPlaceholders(
  template: string,
  values: Record<string, string | number | null | undefined>,
): string {
  return template.replace(PLACEHOLDER, (_m, name: string) => {
    const v = values[name];
    return v === null || v === undefined || v === '' ? '—' : escapeHtml(String(v));
  });
}

/** Placeholder names used in a template (for the editor's help panel and validation). */
export function placeholdersIn(template: string): string[] {
  return [...new Set([...template.matchAll(PLACEHOLDER)].map((m) => m[1] as string))];
}
