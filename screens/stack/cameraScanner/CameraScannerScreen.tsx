import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarCodeScanner, scanFromURLAsync } from 'expo-barcode-scanner';
import { BlurView } from 'expo-blur';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import ScanAnim from 'rn-viviboom/assets/animations/scan-qr.json';
import Config from 'rn-viviboom/constants/Config';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';

const screen = Dimensions.get('screen');

export default function CameraScannerScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'CameraScannerScreen'> }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const loggedInUser = useReduxStateSelector((state) => state.account);

  const [hasPermission, setHasPermission] = useState<boolean>(null);
  const [scanned, setScanned] = useState(false);
  const isRewardEnabled = !!loggedInUser?.branch?.allowVivicoinRewards && !!loggedInUser?.institution?.isRewardEnabled;

  useEffect(() => {
    navigation.setOptions({
      headerTintColor: '#fff',
      headerBackTitle: '',
    });
  }, [colorScheme, navigation]);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const scanQRText = useMemo(() => {
    const words = [];
    if (isRewardEnabled) words.push('transfer', 'rewards');
    if (loggedInUser?.institution?.isVaultEnabled) words.push('Vivivault');
    return words.length > 0 ? `Scan QR code for ${words.join(' / ')}` : '';
  }, [isRewardEnabled, loggedInUser?.institution?.isVaultEnabled]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    if (`${type}` === '256' || `${type}` === 'org.iso.QRCode') {
      if (data.startsWith('viviboom://') || data.startsWith(Config.MobileAppUrl)) {
        // handle app custom link
        const customUrl = data.replace(Config.MobileAppUrl, 'viviboom://');
        navigation.pop();
        Linking.openURL(customUrl);
      } else if (data.startsWith('vivivault 101_')) {
        // spell piece
        navigation.navigate('VivivaultTreasureHuntRoot', { screen: 'VTHSpaceSearchScreen', params: { foundId: +data.split('_')[1] }, initial: false });
      } else if (data === 'vivivault_102') {
        // finished heart shape
        navigation.navigate('VivivaultTreasureHuntRoot', { screen: 'VTHPuzzleScreen', params: { isCompleted: true }, initial: false });
      } else if (data.startsWith('vivivault 103_')) {
        // new stop
        navigation.navigate('VivivaultTreasureHuntRoot', { screen: 'VTHWorldTravelScreen', params: { foundId: +data.split('_')[1] }, initial: false });
      } else if (data.startsWith('vivivault')) {
        navigation.replace('BLEScreen', { code: data });
      }
    } else {
      Toast.show({ text1: 'Code is not recognised', type: 'error' });
    }
    setScanned(false);
  };

  const onLaunchMediaLibrary = async () => {
    const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResponse.granted) {
      return;
    }
    setScanned(true);
    try {
      const mediaDetails = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!mediaDetails.canceled) {
        const scanResults = await scanFromURLAsync(mediaDetails.assets[0].uri);
        if (scanResults.length > 0) {
          handleBarCodeScanned(scanResults[0]);
        } else {
          Toast.show({ text1: 'Code not found', type: 'error' });
        }
      }
    } catch (err) {
      console.warn(err);
    }
    setScanned(false);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={[StyleSheet.absoluteFillObject, styles.cameraContainer]}
        ratio={'16:9'}
        barCodeScannerSettings={{
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <LottieView source={ScanAnim} style={styles.scanAnim} autoPlay speed={0.5} />
      {scanned && (
        <MyButton mode="contained" onPress={() => setScanned(false)}>
          {'Tap to Scan Again'}
        </MyButton>
      )}
      <View style={styles.buttons}>
        <MyText style={styles.descriptionText}>{scanQRText}</MyText>
        {isRewardEnabled && (
          <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('MyQRScreen')}>
            <View style={styles.buttonIcon}>
              <BlurView intensity={100} style={StyleSheet.absoluteFill} />
              <Ionicons name="ios-qr-code" size={20} color="#fff" />
            </View>
            <MyText style={styles.buttonText}>{t('My QR Code')}</MyText>
          </TouchableOpacity>
        )}
        {(isRewardEnabled || loggedInUser?.institution?.isVaultEnabled) && (
          <TouchableOpacity style={styles.buttonContainer} onPress={onLaunchMediaLibrary}>
            <View style={styles.buttonIcon}>
              <BlurView intensity={100} style={StyleSheet.absoluteFill} />
              <Ionicons name="ios-image-outline" size={24} color="#fff" />
            </View>
            <MyText style={styles.buttonText}>{t('Album')}</MyText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    width: screen.width,
    height: screen.height,
  },
  scanAnim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.6,
  },
  buttons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '13%',
    paddingHorizontal: '7%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowRadius: 2,
    textAlign: 'center',
    position: 'absolute',
    top: -36,
    left: 0,
    right: 0,
    paddingHorizontal: '10%',
  },
  buttonContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  buttonText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '400',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowRadius: 2,
  },
});
