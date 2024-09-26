import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import ArrayUtil from 'rn-viviboom/utils/ArrayUtil';
import Base64 from 'rn-viviboom/utils/Base64';
import BluetoothUtil from 'rn-viviboom/utils/BluetoothUtil';

import chestPicture from './assets/chest.png';
import scanQRPicture from './assets/scan-qr.png';
import backgroundPicture from './assets/shrine.jpg';
import { deviceInfo, spells } from './data';

const spell = spells[Math.floor(Math.random() * spells.length)];
const orderedWords = spell.split(' ').map((word, index) => ({ word, id: index }));
const words = ArrayUtil.shuffle([...orderedWords]);
const wordBackgroundColor = '#ddd';

const UnlockStatusType = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  NONE: 'NONE',
};

export default function VTHSpaceSearchScreen({ navigation, route }: VivivaultTreasureHuntStackScreenProps<'VTHSpaceSearchScreen'>) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const manager = useMemo(() => new BleManager(), []);
  const isUnlocked = useReduxStateSelector((s) => s.vivivaultTreasureHunt?.[s.account?.id]?.spaceSearch);

  const anim = useRef(new Animated.Value(0)).current;

  const [foundWordIds, setFoundWordIds] = useState<number[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>(isUnlocked ? words.map((_, idx) => idx) : []);
  const [unlockStatus, setUnlockStatus] = useState(isUnlocked ? UnlockStatusType.SUCCESS : UnlockStatusType.NONE);
  const [isLoading, setLoading] = useState(false);
  const [BLEStatusStr, setBLEStatusStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isModalVisible, setModalVisible] = useState(false);

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

  const onPressFoundWord = (id: number) => () => {
    setFoundWordIds(foundWordIds.filter((fid) => fid !== id));
    setSelectedWordIds(selectedWordIds.concat(id));
  };

  const onPressSelectedWord = (id: number) => () => {
    if (selectedWordIds.length === words.length) setUnlockStatus(UnlockStatusType.NONE);
    setSelectedWordIds(selectedWordIds.filter((fid) => fid !== id));
    setFoundWordIds(foundWordIds.concat(id));
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
        if (device.name === deviceInfo.spaceSearch.name) {
          setBLEStatusStr('Connecting...');
          // Stop scanning as it's not necessary if you are scanning for one device.
          manager.stopDeviceScan();
          // Proceed with connection.
          const deviceConnected = await device.connect();
          setBLEStatusStr('Communicating...');
          await deviceConnected.discoverAllServicesAndCharacteristics();
          const characteristics = await deviceConnected.writeCharacteristicWithResponseForService(
            deviceInfo.spaceSearch.ledServiceUUID,
            deviceInfo.spaceSearch.switchCharacteristicUUID,
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
    if (selectedWordIds.map((id) => orderedWords[id].word).join(' ') !== spell) {
      // fail to match the sequence
      setUnlockStatus(UnlockStatusType.FAILURE);
      setErrorMessage('Please try again!');
      animIn();
    } else {
      // success and unlock
      setUnlockStatus(UnlockStatusType.NONE);
      VTHReduxActions.save({ spaceSearch: true }); // record success redux
      await scanAndUnlock();
    }
  };

  const onReset = () => {
    VTHReduxActions.save({ spaceSearch: false }); // reset redux success
    manager.stopDeviceScan();
    setFoundWordIds([]);
    setSelectedWordIds([]);
    setLoading(false);
    setUnlockStatus(UnlockStatusType.NONE);
    setBLEStatusStr('');
    setErrorMessage('');
    animOut();
  };

  const buttonColor = useMemo(() => {
    if (selectedWordIds.length < words.length) return '#ccc';
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return Colors[colorScheme].success;
  }, [colorScheme, selectedWordIds.length, unlockStatus]);

  const bannerColor = useMemo(() => {
    if (unlockStatus === UnlockStatusType.SUCCESS) return Colors[colorScheme].success;
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return undefined;
  }, [colorScheme, unlockStatus]);

  useEffect(() => {
    const newId = +route?.params?.foundId;
    if (!Number.isNaN(newId)) {
      if (![...foundWordIds, ...selectedWordIds].includes(newId) && newId >= 0 && newId < words.length && newId === Math.floor(newId)) {
        setFoundWordIds((f) => f.concat(route?.params?.foundId));
        setModalVisible(true);
      } else {
        Toast.show({ text1: 'Oops!', text2: 'Looks like you have already gotten this spell piece!', type: 'error' });
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
          <MyText style={styles.titleText}>QUEST ONE</MyText>
        </View>
        <View style={styles.subtitle}>
          <MyText style={styles.subtitleText}>Find the True Spell</MyText>
          <MyText style={styles.description}>
            You found yourself in a dimly lit room filled with dust and cobwebs. In the center of the room stood a large chest, its brass hinges rusted with
            age. You approached the chest and began to study the strange carvings all over the place, searching for clues to unlocking the chest...
          </MyText>
        </View>
        <TouchableOpacity style={styles.scanQr} onPress={() => navigation.push('CameraScannerScreen')} activeOpacity={1}>
          <MyText style={styles.scanQrText}>Scan QR codes around the room to deciper the spell</MyText>
          <MyImage defaultSource={scanQRPicture} style={styles.scanQrPicture} />
        </TouchableOpacity>
        <View style={styles.words}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <MyText style={{ fontSize: 16, color: '#000' }}>
              Spell Pieces ({foundWordIds.length + selectedWordIds.length}/{words.length})
            </MyText>
            <TouchableOpacity activeOpacity={1} onPress={onReset}>
              <MyText style={{ color: '#666', textDecorationLine: 'underline' }}>Reset</MyText>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 12 }}>
            {words.map((w, idx) => (
              <View key={`word-${w.id}`} style={styles.wordShadow}>
                <MyText style={{ color: wordBackgroundColor }}>{w.word}</MyText>
                {foundWordIds.includes(w.id) && (
                  <TouchableOpacity style={styles.wordBackground} activeOpacity={0.9} onPress={onPressFoundWord(w.id)}>
                    <MyText style={{ color: '#333', fontWeight: '400' }}>{w.word}</MyText>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center' }}>
            <MyImage defaultSource={chestPicture} style={styles.chestPicture} />
            <View style={styles.lines}>
              <View style={styles.line} />
              <View style={styles.line} />
              <View style={styles.line} />
              <View style={styles.sentence}>
                {selectedWordIds.map((id) => (
                  <View key={`word-${id}`} style={styles.wordSelected}>
                    <MyText style={{ color: wordBackgroundColor }}>{orderedWords[id].word}</MyText>
                    <TouchableOpacity style={styles.wordBackground} activeOpacity={0.9} onPress={onPressSelectedWord(id)}>
                      <MyText style={{ color: '#333', fontWeight: '400' }}>{orderedWords[id].word}</MyText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
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
            disabled={selectedWordIds.length < words.length || isLoading}
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
              <MyText>Yes! You&apos;ve found a new piece of the spell</MyText>
              <MyText style={{ fontSize: 30, marginVertical: 18, color: Colors[colorScheme].textSecondary }}>
                {foundWordIds.length > 0 ? orderedWords[foundWordIds[foundWordIds.length - 1]].word : ''}
              </MyText>
            </View>
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
    top: 200,
    left: 0,
    width: Layout.screen.width,
    height: Layout.screen.height - 200,
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
    color: '#666',
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
    color: '#666',
    textAlign: 'center',
  },
  scanQrPicture: {
    width: 120,
    height: 120,
  },
  words: {
    width: '100%',
    marginVertical: 18,
  },
  wordShadow: {
    height: 32,
    borderRadius: 12,
    backgroundColor: wordBackgroundColor,
    margin: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  wordSelected: {
    height: 32,
    borderRadius: 12,
    backgroundColor: wordBackgroundColor,
    marginTop: 12,
    marginBottom: 6,
    marginHorizontal: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  wordBackground: {
    position: 'absolute',
    top: 2,
    bottom: 3.5,
    left: 2,
    right: 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },
  lines: {
    marginVertical: 18,
    flex: 1,
  },
  line: {
    width: '100%',
    height: 50,
    borderBottomColor: '#666',
    borderBottomWidth: 2,
  },
  sentence: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chestPicture: {
    width: 100,
    height: 100,
    opacity: 0.9,
    marginRight: 36,
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
});
