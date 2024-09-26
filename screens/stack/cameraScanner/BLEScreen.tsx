import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, LogBox, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import VaultApi from 'rn-viviboom/apis/viviboom/VaultApi';
import ChestAnim from 'rn-viviboom/assets/animations/chest.json';
import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import Base64 from 'rn-viviboom/utils/Base64';
import BluetoothUtil from 'rn-viviboom/utils/BluetoothUtil';

LogBox.ignoreLogs(['`new NativeEventEmitter()`']);

const UnlockStatusType = {
  UNLOCKING: 'UNLOCKING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  NONE: 'NONE',
};

const screen = Dimensions.get('screen');

export default function BLEScreen({ navigation, route }: RootStackScreenProps<'RewardScreen'>) {
  const { t } = useTranslation('translation');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);

  const [vaultCode, setVaultCode] = useState(decodeURIComponent(route?.params?.code || ''));

  const [unlockStatus, setUnlockStatus] = useState(UnlockStatusType.NONE);
  const [isLoading, setLoading] = useState(false);
  const [BLEStatusStr, setBLEStatusStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [placeholder, setPlaceholder] = useState('Enter code here...');

  const lottieLockedRef = useRef<LottieView>();
  const lottieUnlockedRef = useRef<LottieView>();
  const anim = useRef(new Animated.Value(0)).current;

  const manager = useMemo(() => new BleManager(), []);

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

  const unlockVault = useCallback(
    async (vault: Vault) => {
      if (!(await BluetoothUtil.requestPermissions())) {
        setLoading(false);
        Toast.show({ text1: 'Please grant this app bluetooth permission to continue', type: 'error' });
        return;
      }
      setBLEStatusStr('Scanning...');
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
          if (device.name === vault.code) {
            setBLEStatusStr('Connecting...');
            // Stop scanning as it's not necessary if you are scanning for one device.
            manager.stopDeviceScan();
            // Proceed with connection.
            const deviceConnected = await device.connect();
            setBLEStatusStr('Communicating...');
            await deviceConnected.discoverAllServicesAndCharacteristics();
            setUnlockStatus(UnlockStatusType.UNLOCKING);
            lottieUnlockedRef.current?.play();
            animIn();
            setLoading(false);
            const characteristics = await deviceConnected.writeCharacteristicWithResponseForService(
              vault.ledServiceUUID,
              vault.switchCharacteristicUUID,
              Base64.encode(vault.unlockCode || '2'),
            );
            await deviceConnected.cancelConnection();
            setUnlockStatus(UnlockStatusType.SUCCESS);
            setBLEStatusStr('');
            console.log(characteristics.value);
          }
        } catch (err) {
          Toast.show({ text1: err.message, type: 'error' });
          setErrorMessage(err.message);
          setUnlockStatus(UnlockStatusType.FAILURE);
        }
        setLoading(false);
      });
    },
    [manager],
  );

  const onPressUnlock = useCallback(async () => {
    if (!vaultCode) {
      Toast.show({ type: 'error', text1: 'Please enter a Vivivault code to proceed' });
      return;
    }
    setLoading(true);
    try {
      const res = await VaultApi.get({
        authToken,
        code: vaultCode,
      });
      await unlockVault(res.data.vault);
    } catch (err) {
      setLoading(false);
      console.error(err);
      Toast.show({ type: 'error', text1: 'Oops! Your code is incorrect! Please try again!' });
    }
  }, [authToken, unlockVault, vaultCode]);

  const onReset = () => {
    manager.stopDeviceScan();
    setLoading(false);
    setVaultCode('');
    setUnlockStatus(UnlockStatusType.NONE);
    setBLEStatusStr('');
    setErrorMessage('');
    animOut();
  };

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: '',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  // initial animation
  useEffect(() => {
    lottieLockedRef.current?.play(0, 55);
  }, []);

  useEffect(() => {
    if (route?.params?.code) {
      onPressUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buttonColor = useMemo(() => {
    if (!vaultCode) return '#ccc';
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return Colors[colorScheme].success;
  }, [colorScheme, unlockStatus, vaultCode]);

  const buttonTextColor = useMemo(() => {
    if (!vaultCode) return Colors[colorScheme].tint;
    return '#ccc';
  }, [colorScheme, vaultCode]);

  const bannerColor = useMemo(() => {
    if (unlockStatus === UnlockStatusType.UNLOCKING) return Colors[colorScheme].success;
    if (unlockStatus === UnlockStatusType.SUCCESS) return Colors[colorScheme].success;
    if (unlockStatus === UnlockStatusType.FAILURE) return Colors[colorScheme].error;

    return undefined;
  }, [colorScheme, unlockStatus]);

  const isSuccess = unlockStatus === UnlockStatusType.UNLOCKING || unlockStatus === UnlockStatusType.SUCCESS;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ ...styles.container, backgroundColor: Colors[colorScheme].background }}
    >
      <View>
        <MyText style={{ ...styles.largeText, color: Colors[colorScheme].tint }}>{t('Woohoo!')}</MyText>
        <MyText style={{ ...styles.smallText, color: Colors[colorScheme].tint }}>{t('You have found a Vivivault')}</MyText>
      </View>
      <View style={styles.animContainer}>
        <LottieView ref={lottieLockedRef} source={ChestAnim} style={[styles.chestAnim, { opacity: isSuccess ? 0 : 1 }]} loop speed={0.5} />
        <LottieView ref={lottieUnlockedRef} source={ChestAnim} style={[styles.chestAnim, { opacity: isSuccess ? 1 : 0 }]} loop={false} speed={0.5} />
      </View>

      <View style={{ height: 120, alignItems: 'center' }}>
        {isLoading ? (
          <ActivityIndicator size={36} style={{ margin: 36 }} />
        ) : (
          <>
            <MyText style={{ fontSize: 16, textAlign: 'center', marginTop: 24 }}>
              {t(isSuccess ? `Vivivault ${vaultCode}` : 'Enter the code here to unlock your reward!')}
            </MyText>
            {!isSuccess && (
              <View style={{ ...styles.textInputContainer, borderBottomColor: Colors[colorScheme].text }}>
                <TextInput
                  style={{ ...styles.textInput, color: Colors[colorScheme].text }}
                  placeholderTextColor={Colors[colorScheme].text}
                  placeholder={placeholder}
                  onFocus={() => setPlaceholder('')}
                  onChangeText={setVaultCode}
                  value={vaultCode}
                  multiline={true}
                  blurOnSubmit={true}
                  onSubmitEditing={onPressUnlock}
                />
                {vaultCode?.length > 0 && (
                  <TouchableOpacity style={styles.resetButtonContainer} activeOpacity={1} onPress={onReset}>
                    <Ionicons style={{ color: '#aaa' }} name="close-circle-outline" size={25} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Button
              style={{ backgroundColor: buttonColor, color: buttonTextColor, ...styles.unlockButton }}
              mode="contained"
              onPress={onPressUnlock}
              disabled={!vaultCode || isLoading || unlockStatus === UnlockStatusType.UNLOCKING}
            >
              {unlockStatus === UnlockStatusType.SUCCESS ? 'Unlock Again' : BLEStatusStr || 'Unlock'}
            </Button>
          </>
        )}
      </View>
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
          {isSuccess && (
            <View style={styles.statusMessage}>
              <Ionicons name="ios-checkmark-circle" size={24} color="#fff" />
              <MyText style={styles.statusText}>{t(unlockStatus === UnlockStatusType.SUCCESS ? 'Closed' : 'Unlocked!')}</MyText>
            </View>
          )}
          {unlockStatus === UnlockStatusType.FAILURE && (
            <View style={styles.statusMessage}>
              <Ionicons name="ios-close-circle" size={24} color="#fff" />
              <MyText style={styles.statusText}>{errorMessage}</MyText>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: screen.height,
  },
  largeText: {
    fontSize: 28,
    textAlign: 'center',
  },
  smallText: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    margin: 12,
  },
  animContainer: {
    width: '100%',
    height: 240,
    alignItems: 'center',
  },
  chestAnim: {
    position: 'absolute',
    width: 400,
    height: 400,
    top: -32,
  },
  textInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: 40,
    margin: 18,
    width: 200,
    alignItems: 'center',
    borderBottomWidth: 0.5,
  },
  textInput: {
    height: '100%',
    width: '100%',
    textAlign: 'center',
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
  resetButtonContainer: {
    alignItems: 'center',
  },
  footer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: 120,
  },
  unlockButton: {
    width: '100%',
  },
});
