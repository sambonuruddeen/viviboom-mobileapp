import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PermissionsAndroid, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

import backgroundPicture from './assets/globe.jpg';
import scanQRPicture from './assets/scan-qr.png';
import { coordinates, deviceInfo, stops } from './data';

const UnlockStatusType = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  NONE: 'NONE',
};

const canvasSize = Layout.window.width - 2 * 18;
const stopSize = 64;
const scaleY = 0.85;

export default function VTHWorldTravelScreen({ navigation, route }: VivivaultTreasureHuntStackScreenProps<'VTHWorldTravelScreen'>) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const manager = useMemo(() => new BleManager(), []);
  const isUnlocked = useReduxStateSelector((s) => s.vivivaultTreasureHunt?.[s.account?.id]?.worldTravel);

  const anim = useRef(new Animated.Value(0)).current;

  const [foundStopIds, setFoundNodeIds] = useState<number[]>(isUnlocked ? stops.map((v) => v.id) : []);
  const [unlockStatus, setUnlockStatus] = useState(isUnlocked ? UnlockStatusType.SUCCESS : UnlockStatusType.NONE);
  const [isLoading, setLoading] = useState(false);
  const [BLEStatusStr, setBLEStatusStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [touchedStopId, setTouchedStopId] = useState(-1);
  const [selectedStopId, setSelectedStopId] = useState(-1);

  const [isNewStop, setNewStop] = useState(false);

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
        if (device.name === deviceInfo.worldTravel.name) {
          setBLEStatusStr('Connecting...');
          // Stop scanning as it's not necessary if you are scanning for one device.
          manager.stopDeviceScan();
          // Proceed with connection.
          const deviceConnected = await device.connect();
          setBLEStatusStr('Communicating...');
          await deviceConnected.discoverAllServicesAndCharacteristics();
          const characteristics = await deviceConnected.writeCharacteristicWithResponseForService(
            deviceInfo.worldTravel.ledServiceUUID,
            deviceInfo.worldTravel.switchCharacteristicUUID,
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
      setLoading(false);
      animIn();
    });
  };

  const onUnlock = async () => {
    setUnlockStatus(UnlockStatusType.NONE);
    VTHReduxActions.save({ worldTravel: true }); // record success redux
    await scanAndUnlock();
  };

  const onReset = () => {
    VTHReduxActions.save({ worldTravel: false }); // reset redux success
    manager.stopDeviceScan();
    setSelectedStopId(-1);
    setTouchedStopId(-1);
    setNewStop(false);
    setFoundNodeIds([]);
    setLoading(false);
    setUnlockStatus(UnlockStatusType.NONE);
    setBLEStatusStr('');
    setErrorMessage('');
    animOut();
  };

  const onDismiss = () => {
    setSelectedStopId(-1);
    setNewStop(false);
  };

  const buttonColor = useMemo(() => {
    if (foundStopIds.length < stops.length) return '#ccc';
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return Colors[colorScheme].success;
  }, [colorScheme, foundStopIds.length, unlockStatus]);

  const bannerColor = useMemo(() => {
    if (unlockStatus === UnlockStatusType.SUCCESS) return Colors[colorScheme].success;
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return undefined;
  }, [colorScheme, unlockStatus]);

  useEffect(() => {
    const newId = +route?.params?.foundId;
    if (!Number.isNaN(newId)) {
      if (newId >= 0 && newId < stops.length && newId === Math.floor(newId) && newId === foundStopIds.length) {
        setFoundNodeIds((f) => f.concat(newId));
        setNewStop(true);
        setSelectedStopId(newId);
      } else {
        Toast.show({ text1: 'Oops!', text2: 'Looks like you have traveled to the wrong destination!', type: 'error' });
        setFoundNodeIds([]);
      }
    }
  }, [route?.params]);

  return (
    <View style={styles.container}>
      <MyImage defaultSource={backgroundPicture} style={styles.backgroundPicture} />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.5, backgroundColor: '#fff' }]} />
      <View style={{ ...styles.header, paddingTop: insets.top, height: styles.header.height + insets.top }}>
        <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.pop()}>
          <Ionicons name="ios-close-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.push('CameraScannerScreen')}>
          <Ionicons name="ios-scan-outline" size={21} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.contentTitle}>
          <Feather name="map-pin" size={24} color="#7353ff" />
          <MyText style={styles.titleText}>QUEST THREE</MyText>
        </View>
        <View style={styles.subtitle}>
          <MyText style={styles.subtitleText}>A Journey Through Seven Countries</MyText>
          <MyText style={styles.description}>
            One day, you heard of a legendary chest that was said to contain untold riches, but the chest can only be unlocked by solving a series of clues that
            were scattered across seven countries around the world.
          </MyText>
          <MyText style={styles.description}>
            In each country, you will discover a new clue that led you to the next one. The clues have to be found in the{' '}
            <MyText style={{ color: '#000' }}>correct order</MyText> to unlock the chest...
          </MyText>
        </View>
        <TouchableOpacity style={styles.scanQr} onPress={() => navigation.push('CameraScannerScreen')} activeOpacity={1}>
          <MyText style={styles.scanQrText}>Scan QR code to visit a new place</MyText>
          <MyImage defaultSource={scanQRPicture} style={styles.scanQrPicture} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12 }}>
          <MyText style={{ fontSize: 16, color: '#000' }}>
            Stop Visited ({foundStopIds.length}/{stops.length})
          </MyText>
          <TouchableOpacity activeOpacity={1} onPress={onReset}>
            <MyText style={{ color: '#666', textDecorationLine: 'underline' }}>Reset</MyText>
          </TouchableOpacity>
        </View>
        <View style={styles.canvas}>
          {stops.map((v, idx) => {
            const isFound = foundStopIds.includes(v.id);
            return (
              <View
                key={`stop-${v.id}`}
                style={[
                  styles.stopContiner,
                  { left: coordinates[idx].x * canvasSize - stopSize / 2, top: coordinates[idx].y * canvasSize - (stopSize * scaleY) / 2 },
                ]}
                onTouchStart={() => setTouchedStopId(v.id)}
                onTouchEnd={() => setTouchedStopId(-1)}
                onTouchCancel={() => setTouchedStopId(-1)}
              >
                <View style={[styles.stop, { backgroundColor: isFound ? '#2bae66' : '#ccc' }]} />
                <TouchableOpacity
                  style={[styles.actualStop, { top: touchedStopId === v.id ? 0 : -8, backgroundColor: isFound ? '#34cf79' : '#e2e2e2' }]}
                  onPress={() => setSelectedStopId(isFound ? v.id : -1)}
                  activeOpacity={1}
                >
                  {isFound ? (
                    <View style={{ position: 'relative', top: -15 }}>
                      <FontAwesome name="map-marker" size={50} color="#fff" />
                      <MyImage defaultSource={CountryUtil.getCountryFlag(v.countryISO)} style={styles.countryPin} />
                    </View>
                  ) : (
                    <Ionicons name="ios-help" size={30} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
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
            disabled={foundStopIds.length < stops.length || isLoading}
          >
            {unlockStatus === UnlockStatusType.SUCCESS ? 'Unlock Again' : BLEStatusStr || 'Unlock'}
          </MyButton>
        </View>
      </View>
      <Modal visible={selectedStopId >= 0} hardwareAccelerated animationType={'fade'} onRequestClose={onDismiss} transparent>
        <TouchableOpacity style={styles.centeredView} onPress={onDismiss} activeOpacity={1}>
          <View style={[styles.modalContentContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
            <View style={styles.contentTopRow}>
              <TouchableOpacity style={styles.topButton} onPress={onDismiss} activeOpacity={1}>
                <Ionicons name="ios-close-outline" size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            {!isNewStop && selectedStopId >= 0 && (
              <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].contentBackground }]}>
                <MyImage defaultSource={CountryUtil.getCountryFlag(stops[selectedStopId].countryISO)} style={styles.countryImage} />
                <MyText style={{ fontSize: 24, marginTop: 24 }}>{stops[selectedStopId].country}</MyText>
                <MyText style={{ fontSize: 18, marginHorizontal: 18, marginVertical: 12, color: Colors[colorScheme].textSecondary }}>
                  VIVISTOP {stops[selectedStopId].name}
                </MyText>
              </View>
            )}
            {isNewStop && selectedStopId >= 0 && (
              <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].contentBackground }]}>
                <MyText style={{ margin: 8, fontSize: 15 }}>Yes! You have arrived at...</MyText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MyImage defaultSource={CountryUtil.getCountryFlag(stops[selectedStopId].countryISO)} style={styles.countryImage} />
                  <MyText style={{ fontSize: 18, marginHorizontal: 12, marginVertical: 18, color: Colors[colorScheme].textSecondary }}>
                    VIVISTOP {stops[selectedStopId].name}
                  </MyText>
                </View>
                <MyText style={{ margin: 12, fontSize: 16 }}>Your next stop to visit is in {stops[(selectedStopId + 1) % stops.length].continent}</MyText>
              </View>
            )}
          </View>
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
    top: 300,
    left: 0,
    width: Layout.screen.width,
    height: Layout.screen.height - 300,
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
    color: '#999',
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
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  scanQrPicture: {
    width: 120,
    height: 120,
  },
  canvas: {
    width: canvasSize,
    height: canvasSize,
  },
  stopContiner: {
    width: stopSize,
    height: stopSize,
    position: 'absolute',
  },
  stop: {
    width: stopSize,
    height: stopSize,
    borderRadius: stopSize / 2,
    transform: [{ scaleY }], // eclipse
    backgroundColor: '#ccc',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  actualStop: {
    width: stopSize,
    height: stopSize,
    borderRadius: stopSize / 2,
    transform: [{ scaleY }], // eclipse
    backgroundColor: '#e2e2e2',
    position: 'relative',
    top: -8,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  countryPin: {
    width: 29,
    height: 29,
    borderRadius: 15,
    position: 'absolute',
    top: 0,
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
  countryImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
});
