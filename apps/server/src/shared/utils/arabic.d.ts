// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
/**
 * Normalizes Arabic (and Latin) text for search so that common spelling variants match:
 * أ/إ/آ/ٱ → ا, ى → ي, ة → ه, ؤ → و, ئ → ي, removes diacritics (tashkeel) and tatweel,
 * lower-cases Latin, and collapses whitespace.
 */
export declare function normalizeArabic(input: string): string;
/** Builds the stored search key for an entity from the fields that should be searchable. */
export declare function buildSearchKey(...parts: Array<string | null | undefined>): string;
