import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Locale } from '@clinic/shared';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

/**
 * Arabic is the default and the only complete locale. Add a locale by dropping a JSON
 * file next to ar.json and registering it here; missing keys fall back to Arabic.
 * Resources are bundled (no HTTP backend) so translations work fully offline.
 */
export const resources = {
  ar: { translation: ar },
  fr: { translation: fr },
} as const satisfies Record<Locale, { translation: object }>;

export const RTL_LOCALES: readonly Locale[] = ['ar'];

function applyDocumentDirection(lng: string) {
  const locale = (lng in resources ? lng : 'ar') as Locale;
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ar',
  fallbackLng: 'ar',
  supportedLngs: Object.keys(resources),
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentDirection(i18n.language);
i18n.on('languageChanged', applyDocumentDirection);

export default i18n;
