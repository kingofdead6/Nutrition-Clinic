/**
 * Normalizes Arabic (and Latin) text for search so that common spelling variants match:
 * أ/إ/آ/ٱ → ا, ى → ي, ة → ه, ؤ → و, ئ → ي, removes diacritics (tashkeel) and tatweel,
 * lower-cases Latin, and collapses whitespace.
 */
export function normalizeArabic(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // tashkeel
    .replace(/ـ/g, '') // tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Builds the stored search key for an entity from the fields that should be searchable. */
export function buildSearchKey(...parts: Array<string | null | undefined>): string {
  return normalizeArabic(parts.filter(Boolean).join(' '));
}
