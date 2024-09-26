import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import 'intl-pluralrules';
import { initReactI18next } from 'react-i18next';

import { english, estonian, japanese } from './all';

async function init() {
  const savedLang = await AsyncStorage.getItem('lang');
  const res = await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: english },
      ja: { translation: japanese },
      et: { translation: estonian },
    },
    lng: savedLang || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
  // console.log({
  //   resources: {
  //     en: { translation: english },
  //     ja: { translation: japanese },
  //     et: { translation: estonian },
  //   },
  //   lng: savedLang || 'en',
  //   fallbackLng: 'en',
  //   interpolation: {
  //     escapeValue: false,
  //   },
  // });
}
init();

export default i18n;
