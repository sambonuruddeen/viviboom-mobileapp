import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

import badgePicture from './assets/badge.png';
import eventPicture from './assets/event.jpg';
import projectPicture from './assets/project.jpg';

const containerSize = Math.min(Layout.screen.width - 2 * 18, 400);

const imagePadding = 12;
const imageSize = (containerSize - imagePadding * 2) / 3;

const data = [
  { key: 'project', image: projectPicture, description: 'Share your projects!', loc: { x: 0, y: imageSize } },
  { key: 'badge', image: badgePicture, description: 'Earn shiny badges!', loc: { x: imageSize + imagePadding, y: 1.5 * imageSize } },
  { key: 'event', image: eventPicture, description: 'Book our events!', loc: { x: 2 * (imageSize + imagePadding), y: 2 * imageSize } },
];

export default function ThingsToDoScreen({ navigation }: RootStackScreenProps<'ThingsToDoScreen'>) {
  const walkingRef = useRef<LottieView>();
  const walkingAnim = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const anims = useRef(data.map((_) => new Animated.Value(0))).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const animIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 10,
        restDisplacementThreshold: 0.2,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.sequence(
        anims.map((anim) => Animated.spring(anim, {
          toValue: 1,
          velocity: 10,
          useNativeDriver: true,
        })),
      ),
    ]).start(() => {
      Animated.sequence([
        // walking
        Animated.timing(walkingAnim, {
          toValue: { x: 0.8 * imageSize + imagePadding, y: 0.1 * imageSize },
          duration: 600,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(walkingAnim, {
          toValue: { x: imageSize + imagePadding, y: 0.5 * imageSize },
          duration: 200,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(walkingAnim, {
          toValue: { x: 1.8 * imageSize + imagePadding * 2, y: 0.6 * imageSize },
          duration: 600,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.timing(walkingAnim, {
          toValue: { x: 2 * (imageSize + imagePadding), y: 1 * imageSize },
          duration: 200,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ]).start(() => {
        Animated.timing(btnAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    });
  };

  useEffect(() => {
    walkingRef.current.play(0);
    animIn();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.contentContainer}>
        <Animated.View style={[styles.titleContainer, { transform: [{ scale: scaleAnim }] }]}>
          <MyText style={{ fontSize: 22, fontWeight: '600' }}>Some of the cool stuff you can do!</MyText>
        </Animated.View>
        <View style={styles.things}>
          {data.map((item, idx) => (
            <Animated.View
              key={item.key}
              style={{
                position: 'absolute',
                left: item.loc.x,
                top: item.loc.y,
                width: imageSize,
                height: imageSize,
                transform: [{ translateX: anims[idx].interpolate({ inputRange: [0, 1], outputRange: [-Layout.screen.width, 0] }) }],
              }}
            >
              <MyImage defaultSource={item.image} style={{ width: imageSize, height: imageSize, borderRadius: 8 }} />
              <MyText style={{ marginVertical: 8, fontSize: 16, textAlign: 'center', fontWeight: '400' }}>{item.description}</MyText>
            </Animated.View>
          ))}
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, transform: [{ translateX: walkingAnim.x }, { translateY: walkingAnim.y }] }}>
            <LottieView ref={walkingRef} style={styles.walkingAnimation} speed={0.75} source={require('./assets/rocket.json')} />
          </Animated.View>
        </View>
      </View>
      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom, height: styles.footer.height + insets.bottom, opacity: btnAnim }]}>
        <View style={{ flex: 1 }}>
          <MyButton style={{ width: '100%', position: 'absolute', bottom: 12 }} mode="contained" onPress={() => navigation.replace('AddProfileScreen')}>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    position: 'absolute',
    top: 54,
    justifyContent: 'center',
    alignItems: 'center',
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
  things: {
    width: containerSize,
    height: containerSize,
  },
  walkingAnimation: {
    width: imageSize,
    height: imageSize,
    transform: [{ scale: 1.1 }],
  },
  footer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: 120,
  },
});
