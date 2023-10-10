import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import deTranslation from './locales/de/translation.json';

const instance = createInstance();

instance
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      de: { translation: deTranslation },
    },
    lng: 'en',  // default language
    interpolation: {
      escapeValue: false,
    },
  });

export default instance;
