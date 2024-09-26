import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const animationSize = Math.min(Layout.screen.width * 0.6, 500);

export default function WelcomeScreen({ navigation }: RootStackScreenProps<'WelcomeScreen'>) {
  const user = useReduxStateSelector((state) => state.account);
  const bannerRef = useRef<LottieView>();
  const buttonRef = useRef<LottieView>();
  const confettiRef = useRef<LottieView>();
  const textAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const animIn = () => {
    Animated.sequence([
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 400,
        delay: 1200,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: 1500,
        useNativeDriver: false,
      }),
    ]).start(() => {
      confettiRef.current.play();
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 10,
          restSpeedThreshold: 0.2,
          useNativeDriver: true,
        }),
        Animated.timing(btnAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  useEffect(() => {
    animIn();
    bannerRef.current.play(0, 140);
    buttonRef.current.play(0, 140);
  }, []);

  useEffect(() => {
    if (user.isCompletedTutorial) navigation.replace('Root');
  }, [navigation, user.isCompletedTutorial]);

  const headerText = useMemo(() => `HELLO ${user.name.split(' ')[0]}!`, [user]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.contentContainer}>
        <View style={styles.topContainer}>
          <Animated.View style={[styles.titleContainer, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
            <LottieView ref={bannerRef} loop={false} style={styles.bannerAnimation} speed={2} source={require('./assets/emergency.json')} />
            <Animated.View style={[styles.heading, { opacity: textAnim }]}>
              <MyText style={styles.title}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: -2, height: -2 } }}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: -2, height: 2 } }}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: 2, height: -2 } }}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: 2, height: 2 } }}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: 0, height: 2 } }}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: 2, height: 0 } }}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: 0, height: -2 } }}>{headerText}</MyText>
              <MyText style={{ ...styles.title, textShadowOffset: { width: -2, height: 0 } }}>{headerText}</MyText>
            </Animated.View>
          </Animated.View>
          <Animated.View style={[styles.welcomeContainer, { transform: [{ scale: scaleAnim }] }]}>
            <MyText style={{ ...styles.welcomeTextTop, color: Colors[colorScheme].textSecondary }}>WELCOME!!</MyText>
            <MyText style={styles.welcomeTextBottom}>
              Join us to create, share, and play in the <MyText style={{ color: Colors[colorScheme].tint }}>VIVIBOOM</MyText> universe!
            </MyText>
          </Animated.View>
        </View>
        <LottieView ref={buttonRef} loop={false} style={styles.meetingAnimation} speed={2} source={require('./assets/astronaut.json')} />
      </View>
      <LottieView ref={confettiRef} loop={false} style={styles.confettiAnimation} speed={2} source={require('./assets/confetti.json')} />
      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom, height: styles.footer.height + insets.bottom, opacity: btnAnim }]}>
        <View style={{ flex: 1 }}>
          <MyButton style={{ width: '100%', position: 'absolute', bottom: 12 }} mode="contained" onPress={() => navigation.replace('ThingsToDoScreen')}>
            Next
          </MyButton>
        </View>
      </Animated.View>
      <View style={{ ...styles.header, paddingTop: insets.top, height: styles.header.height + insets.top }}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.replace('Root')}>
            <Ionicons name="ios-close-outline" size={30} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  topContainer: {
    height: 100,
    margin: 32,
    width: '100%',
  },
  titleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    position: 'absolute',
    top: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    position: 'absolute',
    letterSpacing: 2,
    fontFamily: 'Copperplate',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
  },
  bannerAnimation: {
    position: 'absolute',
    width: Layout.screen.width,
    height: Layout.screen.width / 2,
  },
  welcomeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTextTop: {
    fontSize: 48,
    fontWeight: '800',
    margin: 18,
  },
  welcomeTextBottom: {
    fontSize: 17,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    width: 70,
  },
  meetingAnimation: {
    width: animationSize,
    height: animationSize,
  },
  confettiAnimation: {
    position: 'absolute',
    width: Layout.screen.width,
    height: Layout.screen.height,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  footer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: 120,
  },
});
