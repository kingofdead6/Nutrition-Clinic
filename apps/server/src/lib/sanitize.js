import sanitize from 'sanitize-html';
import { RICH_TEXT_TAGS } from '@clinic/shared';

/**
 * Keeps only the rich-text subset (no attributes, no styles, no links, no scripts).
 * Placeholder tokens like {{patientName}} are plain text and survive untouched.
 * @param {string} html
 */
export function sanitizeRichText(html) {
  return sanitize(html, {
    allowedTags: [...RICH_TEXT_TAGS],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}
