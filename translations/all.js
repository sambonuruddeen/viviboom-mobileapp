import badges from './views/badges';
import booking from './views/booking';
import challenges from './views/challenges';
import common from './views/common';
import email from './views/email';
import entry from './views/entry';
import home from './views/home';
import members from './views/members';
import myAccount from './views/my-account';
import notifications from './views/notifications';
import projects from './views/projects';
import setting from './views/setting';
import wallet from './views/wallet';
import welcome from './views/welcome';

const convertToSingularLocale = (messages, locale) => {
  const singleLocale = { ...messages };

  for (const property in singleLocale) {
    if (property === locale) {
      return singleLocale[property];
    }
    if (typeof singleLocale[property] === 'object') {
      singleLocale[property] = convertToSingularLocale(singleLocale[property], locale);
    }
  }

  return singleLocale;
};

const translations = {
  general: {
    languageAbbreviation: {
      de: 'de',
      es: 'es',
      en: 'en',
      et: 'et',
      ja: 'ja',
      fr: 'fr',
      zh: 'zh',
      ch: 'ch',
    },
  },

  badges,
  booking,
  email,
  entry,
  home,
  members,
  myAccount,
  notifications,
  projects,
  setting,
  welcome,
  common,
  wallet,
  challenges,
};

export const english = convertToSingularLocale(translations, 'en');
export const japanese = convertToSingularLocale(translations, 'ja');
export const estonian = convertToSingularLocale(translations, 'et');
export const chinese = convertToSingularLocale(translations, 'ch');
export const lithuanian = convertToSingularLocale(translations, 'lt');
export const tagalog = convertToSingularLocale(translations, 'ph');

export const availableLanguages = [
  { name: 'English', nativeName: 'English', code: 'en' },
  { name: 'Japanese', nativeName: '日本語', code: 'ja' },
  { name: 'Estonian', nativeName: 'Eesti', code: 'et' },
  // { name: 'Lithuanian', nativeName: 'Lietuvių', code: 'lt' },
  // { name: 'Tagalog', nativeName: 'Tagalog', code: 'ph' },
  // { name: 'Chinese', nativeName: '华语', code: 'ch' },
];
