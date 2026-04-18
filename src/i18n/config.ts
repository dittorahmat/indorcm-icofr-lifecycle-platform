import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locales
import commonEn from './locales/en/common.json';
import sidebarEn from './locales/en/sidebar.json';
import scopingEn from './locales/en/scoping.json';
import dashboardEn from './locales/en/dashboard.json';
import reportsEn from './locales/en/reports.json';
import knowledgeEn from './locales/en/knowledge.json';

import commonId from './locales/id/common.json';
import sidebarId from './locales/id/sidebar.json';
import scopingId from './locales/id/scoping.json';
import dashboardId from './locales/id/dashboard.json';
import reportsId from './locales/id/reports.json';
import knowledgeId from './locales/id/knowledge.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        sidebar: sidebarEn,
        scoping: scopingEn,
        dashboard: dashboardEn,
        reports: reportsEn,
        knowledge: knowledgeEn,
      },
      id: {
        common: commonId,
        sidebar: sidebarId,
        scoping: scopingId,
        dashboard: dashboardId,
        reports: reportsId,
        knowledge: knowledgeId,
      },
    },
    fallbackLng: 'en',
    ns: ['common', 'sidebar', 'scoping', 'dashboard', 'reports', 'knowledge'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
