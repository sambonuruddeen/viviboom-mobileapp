import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BuilderPalLandingAnim from 'rn-viviboom/assets/animations/builder-pal-landing.json';
import BannerBackground from 'rn-viviboom/assets/images/background.jpg';
import Layout from 'rn-viviboom/constants/Layout';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';

const bannerWidth = Layout.screen.width - 12 * 2;
const bannerHeight = (Layout.screen.width * 9) / 16 - 12 * 2;

export default function HomeBanner() {
  const { t } = useTranslation('translation');
  const isBuilderPalEnabled = useReduxStateSelector((s) => s.account.institution.isBuilderPalEnabled);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const lottieRef = useRef<LottieView>();

  // initial animation
  useEffect(() => {
    lottieRef.current?.play(0);
  }, []);

  return (
    isBuilderPalEnabled && (
      <TouchableOpacity
        style={styles.container}
        onPress={() => navigation.navigate('BuilderPalRoot', { screen: 'BuilderPalChatScreen', initial: false })}
        activeOpacity={0.9}
      >
        <View style={styles.innerContainer}>
          <MyImage style={styles.bannerImage} defaultSource={BannerBackground} />
          <LinearGradient style={styles.bannerImage} colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']} locations={[0, 0.6, 1]} />
          <View style={styles.animContainer}>
            <LottieView ref={lottieRef} source={BuilderPalLandingAnim} style={styles.landingAnim} loop />
          </View>
          <View style={styles.bannerRight}>
            <MyText style={styles.description}>{t('Meet your project pal to whip up something amaaazzzziiing together!')}</MyText>
            <MyText style={styles.heading}>{t('BuilderPal')}</MyText>
          </View>
        </View>
      </TouchableOpacity>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    width: Layout.screen.width,
    height: (Layout.screen.width * 9) / 16,
    padding: 12,
    marginTop: 18,
  },
  innerContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerImage: {
    borderRadius: 12,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: bannerWidth,
    height: bannerHeight,
  },
  animContainer: {
    alignItems: 'center',
  },
  landingAnim: {
    width: bannerHeight,
    height: bannerHeight,
  },
  bannerRight: {
    width: bannerHeight * 0.8,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  heading: {
    fontSize: 24,
    color: '#fff',
  },
  description: {
    width: 156,
    lineHeight: 20,
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
});
