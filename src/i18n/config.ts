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
import bpmEn from './locales/en/bpm.json';
import deficiencyEn from './locales/en/deficiency.json';
import testingEn from './locales/en/testing.json';
import riskLibraryEn from './locales/en/risklibrary.json';
import rcmEn from './locales/en/rcm.json';

import commonId from './locales/id/common.json';
import sidebarId from './locales/id/sidebar.json';
import scopingId from './locales/id/scoping.json';
import dashboardId from './locales/id/dashboard.json';
import reportsId from './locales/id/reports.json';
import knowledgeId from './locales/id/knowledge.json';
import bpmId from './locales/id/bpm.json';
import deficiencyId from './locales/id/deficiency.json';
import testingId from './locales/id/testing.json';
import riskLibraryId from './locales/id/risklibrary.json';
import rcmId from './locales/id/rcm.json';

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
        bpm: bpmEn,
        deficiency: deficiencyEn,
        testing: testingEn,
        risklibrary: riskLibraryEn,
        rcm: rcmEn,
      },
      id: {
        common: commonId,
        sidebar: sidebarId,
        scoping: scopingId,
        dashboard: dashboardId,
        reports: reportsId,
        knowledge: knowledgeId,
        bpm: bpmId,
        deficiency: deficiencyId,
        testing: testingId,
        risklibrary: riskLibraryId,
        rcm: rcmId,
      },
    },
    fallbackLng: 'en',
    ns: ['common', 'sidebar', 'scoping', 'dashboard', 'reports', 'knowledge', 'bpm', 'deficiency', 'testing', 'risklibrary', 'rcm'],
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
