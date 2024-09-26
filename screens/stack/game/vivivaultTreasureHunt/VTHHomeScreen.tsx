import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { VivivaultTreasureHuntStackScreenProps } from 'rn-viviboom/navigation/types';

import checkmark from './assets/checkmark.png';
import backgroundPicture from './assets/map.jpg';
import { finalChest, levels } from './data';

const deviceWidth = Layout.screen.width;
const deviceHeight = Layout.screen.height - Layout.statusBarHeight;

const mapWidth = 645;
const mapHeight = 1398;

const canvasWidth = deviceWidth / deviceHeight < mapWidth / mapHeight ? deviceWidth : (deviceHeight / mapHeight) * mapWidth;
const canvasHeight = deviceWidth / deviceHeight < mapWidth / mapHeight ? (deviceWidth / mapWidth) * deviceHeight : deviceHeight;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const parallelLevels = ['spaceSearch', 'puzzle', 'worldTravel'];

export default function VTHHomeScreen({ navigation }: VivivaultTreasureHuntStackScreenProps<'VTHHomeScreen'>) {
  const colorScheme = useColorScheme();
  const levelCompleted = useReduxStateSelector((s) => s.vivivaultTreasureHunt?.[s.account?.id]);
  const allCleared = useMemo(() => levelCompleted?.spaceSearch && levelCompleted?.puzzle && levelCompleted?.worldTravel, [levelCompleted]);
  const chest = levelCompleted?.finalQuest ? finalChest.unlocked : finalChest.locked;

  const scaleAnim = useRef(new Animated.Value(0)).current;

  const [isModalVisible, setModalVisible] = useState(false);

  const animPlay = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.push('CameraScannerScreen')}>
            <Ionicons name="ios-scan-outline" size={21} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
      headerLeft: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.pop()}>
            <Ionicons name="ios-close-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
      headerTransparent: true,
      headerTintColor: Colors[colorScheme].text,
      title: '',
    });
  }, [colorScheme, navigation]);

  useEffect(() => {
    animPlay();
    if (!levelCompleted?.firepit) navigation.navigate('VTHLandingScreen');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <MyImage defaultSource={backgroundPicture} style={styles.backgroundPicture} />
        {levels.map((level) => (
          <AnimatedTouchable
            key={`level-${level.name}`}
            onPress={() => navigation.navigate(level.screen)}
            style={{
              position: 'absolute',
              top: level.location.y * canvasHeight,
              left: level.location.x * canvasWidth,
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      1,
                      (!allCleared && parallelLevels.includes(level.name) && !levelCompleted?.[level.name]) ||
                      (allCleared && level.name === 'finalQuest' && !levelCompleted?.finalQuest)
                        ? 1.1
                        : 1,
                    ],
                  }),
                },
              ],
            }}
          >
            <MyImage defaultSource={level.image} style={{ width: level.width * canvasWidth, height: level.height * canvasHeight }} />
            {!!levelCompleted?.[level.name] && level.name !== 'firepit' && (
              <MyImage defaultSource={checkmark} style={{ position: 'absolute', top: 4, right: 4, width: 40, height: 40, transform: [{ rotate: '10deg' }] }} />
            )}
          </AnimatedTouchable>
        ))}
        <TouchableOpacity
          onPress={() => navigation.navigate(chest.screen)}
          style={{
            position: 'absolute',
            top: chest.location.y * canvasHeight,
            left: chest.location.x * canvasWidth,
          }}
        >
          <MyImage defaultSource={chest.image} style={{ width: chest.width * canvasWidth, height: chest.height * canvasHeight }} />
        </TouchableOpacity>
        {!!levelCompleted?.finalQuest && (
          <View style={styles.badgeAwarded}>
            <Ionicons name="ios-medal-sharp" size={28} color="#663300" />
            <MyText style={{ color: '#663300', fontSize: 15, width: 80, textAlign: 'center' }}>Badge Awarded!</MyText>
          </View>
        )}
        <TouchableOpacity style={styles.helpButton} onPress={() => setModalVisible(true)}>
          <Feather name="help-circle" size={32} color="#663300" />
        </TouchableOpacity>
      </View>
      <Modal visible={isModalVisible} hardwareAccelerated animationType={'slide'} onRequestClose={() => setModalVisible(false)} transparent>
        <TouchableOpacity style={styles.centeredView} onPress={() => setModalVisible(false)} activeOpacity={1}>
          <View style={[styles.modalContentContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
            <View style={styles.contentTopRow}>
              <TouchableOpacity style={styles.topButton} onPress={() => setModalVisible(false)} activeOpacity={1}>
                <Ionicons name="ios-close-outline" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].contentBackground }]}>
              <MyText style={{ textAlign: 'center', fontSize: 18, margin: 8 }}>About this game</MyText>
              <MyText style={{ fontSize: 15, color: Colors[colorScheme].textSecondary, margin: 12, lineHeight: 20, fontWeight: '400' }}>
                This is a mixed-reality game meant to be played in VIVISTOP with the setup of VIVIVAULTS and required props.
              </MyText>
              <MyText style={{ fontSize: 15, color: Colors[colorScheme].textSecondary, margin: 12, lineHeight: 20, fontWeight: '400' }}>
                A VIVIBOOM badge will be rewarded to you after you successfully open the final chest.
              </MyText>
              <MyText style={{ fontSize: 15, color: Colors[colorScheme].textSecondary, margin: 12, lineHeight: 20, fontWeight: '400' }}>
                Play now to find out what treasure we have prepared for you in each VIVIVAULT!
              </MyText>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#663300',
  },
  contentContainer: {
    width: canvasWidth,
    height: canvasHeight,
  },
  backgroundPicture: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: canvasWidth,
    height: canvasHeight,
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
  badgeAwarded: {
    position: 'absolute',
    top: 0.11 * canvasHeight,
    left: 0.68 * canvasWidth,
    alignItems: 'center',
  },
  helpButton: {
    position: 'absolute',
    top: 0.13 * canvasHeight,
    left: 0.11 * canvasWidth,
  },
  // modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    top: Platform.OS === 'ios' ? -50 : 0,
    width: canvasWidth - 2 * 18,
  },
  contentTopRow: {
    height: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  modalContent: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  topButton: {
    width: 80,
    paddingVertical: 0,
  },
});
