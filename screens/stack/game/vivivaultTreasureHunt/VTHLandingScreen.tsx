import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Layout from 'rn-viviboom/constants/Layout';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import { VivivaultTreasureHuntStackScreenProps } from 'rn-viviboom/navigation/types';
import VTHReduxActions from 'rn-viviboom/redux/vivivaultTreasureHunt/VTHReduxActions';

import nextButton from './assets/next-button.png';
import backgroundPicture from './assets/village.jpg';

export default function VTHLandingScreen({ navigation }: VivivaultTreasureHuntStackScreenProps<'VTHLandingScreen'>) {
  const insets = useSafeAreaInsets();

  const anim = useRef(new Animated.Value(0)).current;

  const animIn = () => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start();
  };

  const onLeave = () => {
    navigation.navigate('VTHHomeScreen');
    VTHReduxActions.save({ firepit: true });
  };

  useEffect(() => {
    animIn();
  }, []);

  return (
    <View style={styles.container}>
      <MyImage defaultSource={backgroundPicture} style={styles.backgroundPicture} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.5, backgroundColor: '#fff' }]} />
      <View style={{ ...styles.header, paddingTop: insets.top, height: styles.header.height + insets.top }} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.contentTitle}>
          <MyText style={styles.titleText}>Welcome to VIVIVAULT Treasure Hunt!</MyText>
        </View>
        <TouchableOpacity style={styles.subtitle} activeOpacity={1} onPress={() => anim.setValue(1)}>
          <MyText style={styles.subtitleText}>Treasure of the Lost Pieces</MyText>
          <Animated.View style={{ opacity: anim.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }) }}>
            <MyText style={styles.description}>
              You are an adventurous explorer, known for your bravery and cunning. You&apos;ve traveled the world searching for treasures and solving puzzles,
              and you&apos;re always on the lookout for your next great challenge.
            </MyText>
          </Animated.View>
          <Animated.View style={{ opacity: anim.interpolate({ inputRange: [0.3, 0.6], outputRange: [0, 1], extrapolate: 'clamp' }) }}>
            <MyText style={styles.description}>
              One day, you come across a mysterious <MyText style={{ color: '#000' }}>quest map</MyText>. The map indicates the location of three missing pieces
              of the portrait of the queen, which have been scattered throughout the world and hidden in different locations.
            </MyText>
          </Animated.View>
          <Animated.View style={{ opacity: anim.interpolate({ inputRange: [0.6, 0.85], outputRange: [0, 1], extrapolate: 'clamp' }) }}>
            <MyText style={styles.description}>
              The legend says that whoever <MyText style={{ color: '#000' }}>finds all three pieces</MyText> and puts the portrait back together will be richly
              rewarded.
            </MyText>
          </Animated.View>
          <Animated.View style={{ opacity: anim.interpolate({ inputRange: [0.85, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }}>
            <MyText style={styles.description}>Intrigued by the challenge, you set out to find the missing pieces of the portrait...</MyText>
          </Animated.View>
        </TouchableOpacity>
        <View style={{ height: styles.footer.height }} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom, height: styles.footer.height + insets.bottom }]}>
        <TouchableOpacity style={styles.nextButton} onPress={onLeave}>
          <MyImage defaultSource={nextButton} style={{ position: 'absolute', top: 0, left: 0, width: 160 }} />
          <MyText style={{ color: '#fff', fontSize: 16 }}>Open Map</MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  footer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: 120,
    alignItems: 'flex-end',
  },
  backgroundPicture: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Layout.screen.width,
    height: Layout.screen.height,
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 18,
    width: Layout.screen.width,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingBtn: {
    marginTop: 1,
  },
  button: {
    margin: 8,
  },
  contentTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    letterSpacing: 2,
    color: '#7353ff',
  },
  subtitle: {
    marginVertical: 16,
  },
  subtitleText: {
    fontWeight: '700',
    fontSize: 20,
    color: '#000',
  },
  description: {
    marginVertical: 8,
    fontSize: 17,
    lineHeight: 20,
    color: '#333',
    fontWeight: '400',
  },
  nextButton: {
    position: 'relative',
    right: -1,
    width: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 26,
    marginVertical: 18,
    height: 52,
  },
});
