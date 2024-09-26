import { Feather, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, PermissionsAndroid, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
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

import backgroundPicture from './assets/palace.jpg';
import portraitFrame from './assets/portrait-frame.png';
import portrait from './assets/portrait.png';
import { deviceInfo, pieces, shadows } from './data';

const UnlockStatusType = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  NONE: 'NONE',
};

const canvasWidth = Math.min(Layout.screen.width - 2 * 18, 400);
const canvasHeight = canvasWidth * 1.25;
const frameSize = 250;
const portraitSize = 0.65 * 250;

const missingPieces = [2, 3, 4];
const initialPieceLocations = missingPieces.map((id, idx) => ({
  id,
  x: (canvasWidth / 3) * idx + (canvasWidth / 3 - pieces[id].width * portraitSize) / 2,
  y: canvasWidth * 0.85,
}));

const portraitX = (canvasWidth - frameSize) / 2 + (frameSize - portraitSize) * 0.5;
const portraitY = (canvasHeight - frameSize) / 8 + (frameSize - portraitSize) * 0.5;

const diffs = initialPieceLocations.map((loc) => ({
  x: portraitX + portraitSize * pieces[loc.id].location.x - loc.x,
  y: portraitY + portraitSize * pieces[loc.id].location.y - loc.y,
}));

const ERROR_THRESHOLD = 10;

const vivivaultTreasureHuntBadgeId = 196;

export default function VTHFinalQuestScreen({ navigation }: VivivaultTreasureHuntStackScreenProps<'VTHFinalQuestScreen'>) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const manager = useMemo(() => new BleManager(), []);
  const user = useReduxStateSelector((s) => s.account);
  const isUnlocked = useReduxStateSelector((s) => s.vivivaultTreasureHunt?.[s.account?.id]?.finalQuest);
  const levelCompleted = useReduxStateSelector((s) => {
    const levels = s.vivivaultTreasureHunt?.[s.account?.id];
    return [levels?.spaceSearch, levels?.puzzle, levels?.worldTravel];
  });
  const allCleared = useMemo(() => levelCompleted.reduce((prev, cur) => prev && cur, true), [levelCompleted]);

  const anim = useRef(new Animated.Value(0)).current;

  const [isCompleted, setCompleted] = useState(isUnlocked);

  const locAnims = useRef(missingPieces.map(() => new Animated.ValueXY())).current;
  const panResponders = useRef(
    missingPieces.map((id, idx) => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          locAnims[idx].setOffset({
            x: locAnims[idx].x._value,
            y: locAnims[idx].y._value,
          });
        },
        onPanResponderMove: Animated.event([null, { dx: locAnims[idx].x, dy: locAnims[idx].y }], { useNativeDriver: false }),
        onPanResponderRelease: () => {
          locAnims[idx].flattenOffset();
          if (Math.max(...diffs.map((diff, index) => (locAnims[index].x._value - diff.x) ** 2 + (locAnims[index].y._value - diff.y) ** 2)) < ERROR_THRESHOLD) {
            setCompleted(true);
            animIn();
            setModalVisible(true);
            VTHReduxActions.save({ finalQuest: true });
          }
        },
      })),
  ).current;

  const [unlockStatus, setUnlockStatus] = useState(isUnlocked ? UnlockStatusType.SUCCESS : UnlockStatusType.NONE);
  const [isLoading, setLoading] = useState(false);
  const [BLEStatusStr, setBLEStatusStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalVisible, setModalVisible] = useState(false);

  const lottieRef = useRef<LottieView>();

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
        if (device.name === deviceInfo.finalQuest.name) {
          setBLEStatusStr('Connecting...');
          // Stop scanning as it's not necessary if you are scanning for one device.
          manager.stopDeviceScan();
          // Proceed with connection.
          const deviceConnected = await device.connect();
          setBLEStatusStr('Communicating...');
          await deviceConnected.discoverAllServicesAndCharacteristics();
          const characteristics = await deviceConnected.writeCharacteristicWithResponseForService(
            deviceInfo.finalQuest.ledServiceUUID,
            deviceInfo.finalQuest.switchCharacteristicUUID, // need to change
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
      // award viviboom badge
      try {
        await UserApi.postBadge({ authToken: user?.authToken, userId: user?.id, badgeId: vivivaultTreasureHuntBadgeId });
      } catch (err) {
        // fail to award badge
      }
      setUnlockStatus(UnlockStatusType.NONE);
      await scanAndUnlock();
    }
  };

  const onReset = () => {
    VTHReduxActions.save({ finalQuest: false }); // reset redux success
    manager.stopDeviceScan();
    setLoading(false);
    setCompleted(false);
    setUnlockStatus(UnlockStatusType.NONE);
    setBLEStatusStr('');
    setErrorMessage('');
    locAnims.forEach((a) => a.setValue({ x: 0, y: 0 }));
    animOut();
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
    if (isCompleted) lottieRef.current?.play(0);
  }, [isCompleted]);

  return (
    <View style={styles.container}>
      <MyImage defaultSource={backgroundPicture} style={styles.backgroundPicture} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.5, backgroundColor: '#000' }]} />
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
          <Feather name="key" size={24} color="#ad9bfa" />
          <MyText style={styles.titleText}>FINAL QUEST</MyText>
        </View>
        <View style={styles.subtitle}>
          <MyText style={styles.subtitleText}>Respect to The Queen</MyText>
          <MyText style={styles.description}>
            {allCleared
              ? 'You have searched high and low for the missing pieces of the portrait. It is time to place the three pieces back into the frame...'
              : 'One day, a wicked sorcerer broke into the palace and stole a valuable portrait of the queen that was hanging on the wall. The sorcerer scattered three pieces in different parts of the kingdom, hoping that no one would ever find them...'}
          </MyText>
          {!allCleared && (
            <MyText style={{ ...styles.description, fontWeight: '600', color: '#fff' }}>
              You need to first find all three missing pieces to fix the portrait of the queen.
            </MyText>
          )}
        </View>
        <TouchableOpacity activeOpacity={1} onPress={onReset}>
          <MyText style={{ color: '#aaa', textDecorationLine: 'underline' }}>Reset</MyText>
        </TouchableOpacity>
        <View style={styles.canvas}>
          <MyImage defaultSource={portraitFrame} style={styles.portraitFrame} />
          {missingPieces.map((id, idx) => (
            <View
              key={shadows[id].name}
              style={{
                position: 'absolute',
                top: initialPieceLocations[idx].y,
                left: initialPieceLocations[idx].x,
              }}
            >
              <MyImage
                defaultSource={shadows[id].image}
                style={{
                  width: portraitSize * shadows[id].width,
                  height: portraitSize * shadows[id].height,
                }}
              />
            </View>
          ))}
          {isCompleted ? (
            <MyImage defaultSource={portrait} style={styles.portrait} />
          ) : (
            <>
              <View style={styles.portrait}>
                {pieces.slice(0, 2).map((piece) => (
                  <MyImage
                    key={piece.name}
                    defaultSource={piece.image}
                    style={{
                      position: 'absolute',
                      top: portraitSize * piece.location.y,
                      left: portraitSize * piece.location.x,
                      width: portraitSize * piece.width,
                      height: portraitSize * piece.height,
                    }}
                  />
                ))}
              </View>
              {missingPieces.map(
                (id, idx) =>
                  levelCompleted[idx] && (
                    <Animated.View
                      key={pieces[id].name}
                      style={{
                        position: 'absolute',
                        top: initialPieceLocations[idx].y,
                        left: initialPieceLocations[idx].x,
                        transform: locAnims[idx].getTranslateTransform(),
                      }}
                      {...panResponders[idx].panHandlers}
                    >
                      <MyImage
                        defaultSource={pieces[id].image}
                        style={{
                          width: portraitSize * pieces[id].width,
                          height: portraitSize * pieces[id].height,
                        }}
                      />
                    </Animated.View>
                ),
              )}
            </>
          )}
        </View>
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
      <Modal visible={isModalVisible} hardwareAccelerated animationType={'slide'} onRequestClose={() => setModalVisible(false)} transparent>
        <TouchableOpacity style={styles.centeredView} onPress={() => setModalVisible(false)} activeOpacity={1}>
          <View style={[styles.modalContentContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
            <View style={styles.contentTopRow}>
              <TouchableOpacity style={styles.topButton} onPress={() => setModalVisible(false)} activeOpacity={1}>
                <Ionicons name="ios-close-outline" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].contentBackground }]}>
              <MyText style={{ textAlign: 'center', fontSize: 28, margin: 8 }}>🎉 Congratulations!</MyText>
              <MyText style={{ textAlign: 'center', fontSize: 16, color: '#aaa', margin: 12 }}>
                The portrait of the queen is once again displayed proudly on the wall of the palace.
              </MyText>
              <MyText style={{ textAlign: 'center', fontSize: 18, margin: 18 }}>Open the final chest now for a reward from the queen!</MyText>
            </View>
          </View>
          <LottieView ref={lottieRef} loop={false} style={styles.lottieAnimation} speed={2} source={require('./assets/confetti.json')} />
        </TouchableOpacity>
      </Modal>
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
    marginHorizontal: 8,
    color: '#ad9bfa',
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
  canvas: {
    width: canvasWidth,
    height: canvasHeight,
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
  portraitFrame: {
    width: frameSize,
    height: frameSize,
    position: 'absolute',
    top: (canvasHeight - frameSize) / 8,
    left: (canvasWidth - frameSize) / 2,
  },
  portrait: {
    width: portraitSize,
    height: portraitSize,
    position: 'absolute',
    top: portraitY,
    left: portraitX,
  },
  // modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
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
    width: canvasWidth,
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
  lottieAnimation: {
    position: 'absolute',
    width: Layout.screen.width,
    height: Layout.screen.height,
  },
});
