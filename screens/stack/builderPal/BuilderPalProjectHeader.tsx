import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { BuilderPalStackParamList } from 'rn-viviboom/navigation/types';

const headerHeight = 60;
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

interface ProjectHeaderProps {
  onBackPressed: () => void;
  animatedOffset: Animated.Value;
  carouselHeight: number;
}

export default function BuilderPalProjectHeader({ onBackPressed, animatedOffset, carouselHeight }: ProjectHeaderProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<BuilderPalStackParamList, 'BuilderPalProjectScreen'>>();

  const heightUpperLimit = useMemo(() => Math.max(carouselHeight - insets.top - headerHeight, 0), [carouselHeight, insets.top]);

  return (
    <>
      <LinearGradient
        style={{ ...styles.gradient, height: styles.gradient.height + insets.top }}
        colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)', 'transparent']}
        locations={[0, 0.5, 1]}
      />
      <Animated.View
        style={{
          ...styles.container,
          paddingTop: insets.top,
          height: styles.container.height + insets.top,
          backgroundColor: Colors[colorScheme].contentBackground,
          opacity: animatedOffset.interpolate({
            inputRange: [0, heightUpperLimit],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
        }}
      />
      <View style={{ ...styles.container, paddingTop: insets.top, height: styles.container.height + insets.top }}>
        <View style={styles.button}>
          <TouchableOpacity onPress={onBackPressed}>
            <AnimatedIcon
              name="ios-chevron-back-outline"
              size={24}
              style={{
                color: animatedOffset.interpolate({
                  inputRange: [0, heightUpperLimit],
                  outputRange: ['#fff', Colors[colorScheme].text],
                  extrapolate: 'clamp',
                }),
              }}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.rightButton}>
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('BuilderPalHomeScreen')} activeOpacity={0.8}>
            <AnimatedIcon
              name="ios-home-outline"
              size={24}
              style={{
                color: animatedOffset.interpolate({
                  inputRange: [0, heightUpperLimit],
                  outputRange: ['#fff', Colors[colorScheme].text],
                  extrapolate: 'clamp',
                }),
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: headerHeight * 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 50,
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeButton: {
    marginRight: 18,
  },
  projectAuthor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: { width: 32, height: 32 },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 18,
  },
  authorInfo: {
    justifyContent: 'center',
    marginHorizontal: 10,
    flexDirection: 'row',
  },
  nameText: { marginRight: 4, fontSize: 15 },
});
