import { ImageRequireSource } from 'react-native';

import Ee from 'rn-viviboom/assets/images/countries/ee.png';
import Jp from 'rn-viviboom/assets/images/countries/jp.png';
import Lt from 'rn-viviboom/assets/images/countries/lt.png';
import Nz from 'rn-viviboom/assets/images/countries/nz.png';
import Ph from 'rn-viviboom/assets/images/countries/ph.png';
import Sg from 'rn-viviboom/assets/images/countries/sg.png';
import Us from 'rn-viviboom/assets/images/countries/us.png';

const countryImages: Record<string, ImageRequireSource> = {
  SG: Sg as ImageRequireSource,
  PH: Ph as ImageRequireSource,
  JP: Jp as ImageRequireSource,
  LT: Lt as ImageRequireSource,
  EE: Ee as ImageRequireSource,
  US: Us as ImageRequireSource,
  NZ: Nz as ImageRequireSource,
};

const countries = [
  {
    label: 'Estonia',
    flag: '🇪🇪',
    code: 'EE',
  },
  {
    label: 'United States',
    flag: '🇺🇸',
    code: 'US',
  },
  {
    label: 'Japan',
    flag: '🇯🇵',
    code: 'JP',
  },
  {
    label: 'Lithuania',
    flag: '🇱🇹',
    code: 'LT',
  },
  {
    label: 'New Zealand',
    flag: '🇳🇿',
    code: 'NZ',
  },
  {
    label: 'Philippines',
    flag: '🇵🇭',
    code: 'PH',
  },
  {
    label: 'Singapore',
    flag: '🇸🇬',
    code: 'SG',
  },
];

const getCountryFlag = (countryISO: string) => countryImages[countryISO];

const getCountryFlagEmoji = (countryISO) => countries.find((c) => c.code === countryISO)?.flag || '🚩';

export default {
  getCountryFlag,
  getCountryFlagEmoji,
};
