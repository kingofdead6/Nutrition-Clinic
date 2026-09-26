import 'i18next';
import type ar from './locales/ar.json';

/** Typed `t()` keys: a typo in a translation key is a compile error. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof ar };
    returnNull: false;
  }
}
