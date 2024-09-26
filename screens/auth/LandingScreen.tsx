import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import AppIcon from 'rn-viviboom/assets/images/icon-transparent.png';
import LogoDark from 'rn-viviboom/assets/images/viviboom-logo-dark.png';
import Logo from 'rn-viviboom/assets/images/viviboom-logo.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import { RootStackScreenProps } from '../../navigation/types';

const deviceWidth = Layout.screen.width;
const deviceHeight = Layout.screen.height - Layout.statusBarHeight;

const splashWidth = 1284;
const splashHeight = 2778;

const iconSize = deviceWidth / deviceHeight > splashWidth / splashHeight ? (450 / splashHeight) * deviceHeight : (450 / splashWidth) * deviceWidth;
const logoWidth = 1.15 * iconSize;
// The numerator multiplier is the height pixels, and the denominator is the width pixels (image size: 71 x 356)
const logoHeight = (logoWidth * 71) / 356;

export default function LandingScreen({ navigation }: RootStackScreenProps<'LandingScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'entry' });
  const colorScheme = useColorScheme();
  const iconAnim = useRef(new Animated.Value(0)).current;
  const showAnim = useRef(new Animated.Value(0)).current;

  const animPlay = () => {
    Animated.sequence([
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: false,
      }),
      Animated.timing(showAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const onPressLogin = () => {
    navigation.navigate('LoginScreen');
  };

  useEffect(() => {
    animPlay();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.iconContainers}>
        <Animated.Image
          source={AppIcon}
          style={[
            styles.appIcon,
            {
              opacity: iconAnim,
              transform: [
                { scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [1.2, 1] }) },
                { translateY: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15 * deviceHeight, 0] }) },
              ],
            },
          ]}
        />
        <Animated.Image source={colorScheme === 'dark' ? LogoDark : Logo} style={[styles.logo, { opacity: showAnim }]} />
      </View>
      <Animated.View style={[styles.buttonContainer, { opacity: showAnim }]}>
        <MyButton style={styles.institutionButton} mode="contained" onPress={onPressLogin}>
          {t('loginHere')}
        </MyButton>
        <View style={styles.textButtons}>
          <TouchableOpacity style={{ borderRightWidth: 2, borderRightColor: '#ccc' }} onPress={() => navigation.navigate('SignUpScreen')}>
            <MyText style={{ ...styles.buttonText, color: Colors[colorScheme].textSecondary }}>{t('vivitaRegister')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SignUpCodeScreen')}>
            <MyText style={{ ...styles.buttonText, color: Colors[colorScheme].textSecondary }}>{t('haveCode')}</MyText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainers: {
    alignItems: 'center',
    marginBottom: 0.3 * deviceHeight,
  },
  appIcon: {
    width: iconSize,
    height: iconSize,
    marginVertical: 18,
  },
  logo: {
    width: logoWidth,
    height: logoHeight,
  },
  buttonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: 200,
  },
  institutionButton: {
    justifyContent: 'center',
  },
  textButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  buttonText: {
    paddingHorizontal: 12,
    fontSize: 17,
    color: '#666',
  },
});
