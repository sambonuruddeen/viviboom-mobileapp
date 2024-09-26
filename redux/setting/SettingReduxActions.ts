import { ColorSchemeName } from 'react-native';

import StoreConfig from '../StoreConfig';
import { set } from './index';

interface Settings {
  colorScheme?: string;
}

const save = (data: Settings) => {
  StoreConfig.dispatchStore(set(data));
};

const toggleColorScheme = (colorScheme: ColorSchemeName) => {
  StoreConfig.dispatchStore(set({ colorScheme: colorScheme === 'light' ? 'dark' : 'light' }));
};

export default {
  save,
  toggleColorScheme,
};
