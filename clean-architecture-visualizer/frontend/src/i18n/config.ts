import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enChecker from './locales/en/checker.json';
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enLegend from './locales/en/legend.json';
import enPatternAnalyzer from './locales/en/pattern-analyzer.json';
import enProjectStarter from './locales/en/projectStarter.json';
import enViolationsSideBarContent from './locales/en/violationsSideBarContent.json';

const isTestMode =
  import.meta.env.VITE_TEST_MODE === 'true' ||
  new URLSearchParams(window.location.search).get('lng') === 'cimode';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      checker: enChecker,
      home: enHome,
      common: enCommon,
      violationsSideBarContent: enViolationsSideBarContent,
      legend: enLegend,
      patternAnalyzer: enPatternAnalyzer,
      projectStarter: enProjectStarter,
    },
  },
  lng: isTestMode ? 'cimode' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});
