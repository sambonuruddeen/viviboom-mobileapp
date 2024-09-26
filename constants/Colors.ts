const tintColorLight = '#7353ff';
const tintColorLightShadow = '#EFECFF';
const tintColorDark = '#fff';
const tintColorDarkShadow = '#8a71fd';

export default {
  light: {
    text: '#000',
    textInverse: '#fff',
    textInactive: '#a2a2a2',
    textSecondary: '#666',
    textInput: '#f2f2f2',
    background: '#fff',
    secondaryBackground: '#f2f2f2',
    contentBackground: '#fff',
    tint: tintColorLight,
    tintShadow: tintColorLightShadow,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,

    success: '#2bae66',
    warning: '#ffa500',
    error: '#fd4350',
  },
  dark: {
    text: '#fff',
    textInverse: tintColorLight,
    textInactive: '#a2a2a2',
    textSecondary: '#aaa',
    textInput: '#333',
    background: '#000',
    secondaryBackground: '#222',
    contentBackground: '#222',
    tint: tintColorDark,
    tintShadow: tintColorDarkShadow,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,

    success: '#2bae66',
    warning: '#ffa500',
    error: '#fd4350',
  },
};
