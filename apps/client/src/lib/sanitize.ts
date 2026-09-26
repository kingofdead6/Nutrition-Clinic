import DOMPurify from 'dompurify';
import { RICH_TEXT_TAGS } from '@clinic/shared';

/** Same allowlist as the server: a few formatting tags, no attributes at all. */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [...RICH_TEXT_TAGS], ALLOWED_ATTR: [] });
}
