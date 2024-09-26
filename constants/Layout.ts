import { Dimensions, Platform, StatusBar } from 'react-native';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

const screenHeight = Dimensions.get('screen').height;
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;
const bottomNavigatorBarHeight = Platform.OS === 'android' ? screenHeight - height - statusBarHeight : 0;

export default {
  window: {
    width,
    height,
  },
  screen: Dimensions.get('screen'),
  statusBarHeight,
  bottomNavigatorBarHeight,
  isSmallDevice: width < 375,
};
