import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PermissionsAndroid, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { VivivaultTreasureHuntStackScreenProps } from 'rn-viviboom/navigation/types';
import VTHReduxActions from 'rn-viviboom/redux/vivivaultTreasureHunt/VTHReduxActions';
import Base64 from 'rn-viviboom/utils/Base64';
import BluetoothUtil from 'rn-viviboom/utils/BluetoothUtil';

import healedHeart from './assets/healed-heart.png';
import backgroundPicture from './assets/heart-chest.jpg';
import scanQRPicture from './assets/scan-qr.png';
import shatteredHeart from './assets/shattered-heart.png';
import shine from './assets/shiny.gif';
import { deviceInfo } from './data';

const UnlockStatusType = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  NONE: 'NONE',
};

const heartSize = 180;

export default function VTHPuzzleScreen({ navigation, route }: VivivaultTreasureHuntStackScreenProps<'VTHPuzzleScreen'>) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const manager = useMemo(() => new BleManager(), []);
  const isUnlocked = useReduxStateSelector((s) => s.vivivaultTreasureHunt?.[s.account?.id]?.puzzle);

  const anim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const [isCompleted, setCompleted] = useState(isUnlocked);
  const [unlockStatus, setUnlockStatus] = useState(isUnlocked ? UnlockStatusType.SUCCESS : UnlockStatusType.NONE);
  const [isLoading, setLoading] = useState(false);
  const [BLEStatusStr, setBLEStatusStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const animIn = () => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const animOut = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const playHeartAnimation = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(flipAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          { iterations: 6 },
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 6 },
        ),
      ]),
    ]).start();
  };

  const scanAndUnlock = async () => {
    if (!(await BluetoothUtil.requestPermissions())) {
      Toast.show({ text1: 'Please grant this app bluetooth permission to continue', type: 'error' });
      return;
    }
    setBLEStatusStr('Scanning...');
    setLoading(true);
    if ((await manager.state()) !== 'PoweredOn') {
      setLoading(false);
      setErrorMessage('Please turn on your bluetooth device to continue');
      setUnlockStatus(UnlockStatusType.FAILURE);
      animIn();
      return;
    }
    manager.startDeviceScan(null, null, async (error, device) => {
      try {
        if (error) {
          setLoading(false);
          setErrorMessage(error.message);
          setUnlockStatus(UnlockStatusType.FAILURE);
          animIn();
          // Handle error (scanning will be stopped automatically)
          return;
        }
        // Check if it is a device you are looking for based on advertisement data
        // or other criteria.
        if (device.name === deviceInfo.puzzle.name) {
          setBLEStatusStr('Connecting...');
          // Stop scanning as it's not necessary if you are scanning for one device.
          manager.stopDeviceScan();
          // Proceed with connection.
          const deviceConnected = await device.connect();
          setBLEStatusStr('Communicating...');
          await deviceConnected.discoverAllServicesAndCharacteristics();
          const characteristics = await deviceConnected.writeCharacteristicWithResponseForService(
            deviceInfo.puzzle.ledServiceUUID,
            deviceInfo.puzzle.switchCharacteristicUUID, // need to change
            Base64.encode('2'),
          );
          await deviceConnected.cancelConnection();
          setBLEStatusStr('');
          setUnlockStatus(UnlockStatusType.SUCCESS);
          console.log(characteristics.value);
        }
      } catch (err) {
        Toast.show({ text1: err.message, type: 'error' });
        setErrorMessage(err.message);
        setUnlockStatus(UnlockStatusType.FAILURE);
      }
      animIn();
      setLoading(false);
    });
  };

  const onUnlock = async () => {
    if (isCompleted) {
      setUnlockStatus(UnlockStatusType.NONE);
      await scanAndUnlock();
    }
  };

  const onReset = () => {
    VTHReduxActions.save({ puzzle: false }); // reset redux success
    manager.stopDeviceScan();
    setLoading(false);
    setCompleted(false);
    setUnlockStatus(UnlockStatusType.NONE);
    setBLEStatusStr('');
    setErrorMessage('');
    animOut();
    flipAnim.setValue(0);
    fadeAnim.setValue(1);
    slideAnim.setValue(1);
    scaleAnim.setValue(0);
  };

  const buttonColor = useMemo(() => {
    if (!isCompleted) return '#ccc';
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return Colors[colorScheme].success;
  }, [colorScheme, isCompleted, unlockStatus]);

  const bannerColor = useMemo(() => {
    if (unlockStatus === UnlockStatusType.SUCCESS) return Colors[colorScheme].success;
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return undefined;
  }, [colorScheme, unlockStatus]);

  useEffect(() => {
    if (route.params?.isCompleted) {
      VTHReduxActions.save({ puzzle: true }); // record success redux
      setCompleted(true);
    }
  }, [route.params]);

  useEffect(() => {
    if (isCompleted) playHeartAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  return (
    <View style={styles.container}>
      <MyImage defaultSource={backgroundPicture} style={styles.backgroundPicture} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.2, backgroundColor: '#000' }]} />
      <View style={{ ...styles.header, paddingTop: insets.top, height: styles.header.height + insets.top }}>
        <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.pop()}>
          <Ionicons name="ios-close-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.push('CameraScannerScreen')}>
          <Ionicons name="ios-scan-outline" size={21} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.contentTitle}>
          <Feather name="map-pin" size={24} color="#7353ff" />
          <MyText style={styles.titleText}>QUEST TWO</MyText>
        </View>
        <View style={styles.subtitle}>
          <MyText style={styles.subtitleText}>Mend a Shattered Heart</MyText>
          <MyText style={styles.description}>
            The puzzle was made of several pieces of a broken heart that was scattered across a dangerous and remote island. You took up the challenge and set
            off on your journey, solving challenging riddles to find each piece of the shattered heart.
          </MyText>
          <MyText style={styles.description}>With every piece, you gained a deeper understanding of the meaning behind the shattered heart...</MyText>
        </View>
        <TouchableOpacity activeOpacity={1} onPress={onReset}>
          <MyText style={{ color: '#aaa', textDecorationLine: 'underline' }}>Reset</MyText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanQr} onPress={() => navigation.push('CameraScannerScreen')} activeOpacity={1}>
          {isCompleted ? (
            <MyText style={{ ...styles.scanQrText, color: '#fff', fontWeight: '600' }}>Yes! You have solved the puzzle</MyText>
          ) : (
            <MyText style={styles.scanQrText}>Scan QR code to heal the wounded heart</MyText>
          )}
          <MyImage defaultSource={scanQRPicture} style={styles.scanQrPicture} />
        </TouchableOpacity>
        <View style={{ height: styles.footer.height }} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom, height: styles.footer.height + insets.bottom }]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: 0.5,
              backgroundColor: bannerColor,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [styles.footer.height + insets.bottom, 0] }) }],
              padding: 18,
            },
          ]}
        />
        <View style={{ flex: 1, marginHorizontal: 18 }}>
          {unlockStatus === UnlockStatusType.SUCCESS && (
            <View style={styles.statusMessage}>
              <Ionicons name="ios-checkmark-circle" size={24} color="#fff" />
              <MyText style={styles.statusText}>Unlocked!</MyText>
            </View>
          )}
          {unlockStatus === UnlockStatusType.FAILURE && (
            <View style={styles.statusMessage}>
              <Ionicons name="ios-close-circle" size={24} color="#fff" />
              <MyText style={styles.statusText}>{errorMessage}</MyText>
            </View>
          )}
          <MyButton
            style={{ position: 'absolute', bottom: 12, width: '100%', backgroundColor: buttonColor }}
            mode="contained"
            onPress={onUnlock}
            disabled={!isCompleted || isLoading}
          >
            {unlockStatus === UnlockStatusType.SUCCESS ? 'Unlock Again' : BLEStatusStr || 'Unlock'}
          </MyButton>
        </View>
      </View>
      <Animated.View
        style={[
          styles.animation,
          {
            transform: [
              { perspective: 500 },
              Platform.OS === 'ios'
                ? { rotate: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }
                : { rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (Layout.screen.height + heartSize) / 2] }) },
            ],
            opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }] }}>
          <MyImage defaultSource={healedHeart} style={styles.heartImage} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[
          styles.animation,
          {
            transform: [
              { perspective: 500 },
              Platform.OS === 'ios'
                ? { rotate: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }
                : { rotateY: flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (Layout.screen.height + heartSize) / 2] }) },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <MyImage defaultSource={shatteredHeart} style={styles.heartImage} />
      </Animated.View>
      <Animated.View style={[styles.animation, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <MyImage defaultSource={shine} style={styles.heartImage} />
      </Animated.View>
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
  },
  backgroundPicture: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Layout.screen.width,
    height: Layout.screen.height,
  },
  container: {
    backgroundColor: '#000',
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
    marginHorizontal: 8,
    color: '#7353ff',
  },
  subtitle: {
    marginVertical: 16,
  },
  subtitleText: {
    fontWeight: '700',
    fontSize: 20,
    color: '#fff',
  },
  description: {
    marginVertical: 8,
    fontSize: 17,
    lineHeight: 20,
    color: '#aaa',
    fontWeight: '400',
  },
  scanQr: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 18,
  },
  scanQrText: {
    flex: 1,
    marginTop: 18,
    padding: 18,
    fontSize: 18,
    fontWeight: '400',
    color: '#aaa',
    textAlign: 'center',
  },
  scanQrPicture: {
    width: 120,
    height: 120,
  },
  statusMessage: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 18,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 18,
  },
  animation: {
    position: 'absolute',
    bottom: (Layout.screen.height - heartSize) / 2,
    left: (Layout.screen.width - heartSize) / 2,
  },
  heartImage: {
    width: heartSize,
    height: heartSize,
  },
});
