import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import { CACHE_FOLDER } from 'rn-viviboom/hoc/CacheManager';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const DEFAULT_PROFILE_IMAGE_SIZE = 128;
const QR_SIZE = 225;

const MyQRScreen = ({ navigation }: RootStackScreenProps<'MyQRScreen'>) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const loggedInUser = useReduxStateSelector((state) => state.account);
  const qrRef = useRef<any>();

  const [profileImageSrc, setProfileImageSrc] = useState<{ uri: string }>(null);

  const qrUrl = useMemo(() => `${Config.MobileAppUrl}/transaction/receiver/${loggedInUser?.id}`, [loggedInUser?.id]);

  const fetchProfileImage = useCallback(async () => {
    const width = 64;
    const requestParams = {
      authToken: loggedInUser.authToken,
      userId: loggedInUser.id,
    };
    try {
      const res = await axios.get<string>(loggedInUser.profileImageUri, {
        headers: { 'auth-token': loggedInUser.authToken },
        params: { width, ...requestParams },
        responseType: 'arraybuffer',
      });
      setProfileImageSrc({ uri: `data:image/jpg;base64, ${Buffer.from(res.data, 'binary').toString('base64')}` });
    } catch (err) {
      console.error(err);
    }
  }, [loggedInUser?.authToken, loggedInUser?.id, loggedInUser?.profileImageUri]);

  const downloadQrCode = useCallback(
    async (data: string) => {
      const unixTime = Math.floor(new Date().getTime() / 1000);
      const filename = `${CACHE_FOLDER}user_${loggedInUser.id}_profile_qr_${unixTime}.png`;
      await FileSystem.writeAsStringAsync(filename, data, { encoding: FileSystem.EncodingType.Base64 });
      return filename;
    },
    [loggedInUser?.id],
  );

  const onPressSave = useCallback(() => {
    if (qrRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      qrRef.current?.toDataURL(async (data: string) => {
        try {
          const permissionResponse = await MediaLibrary.requestPermissionsAsync();
          if (!permissionResponse.granted) {
            Toast.show({ text1: 'Permission denined.', type: 'error' });
            return;
          }
          const filename = await downloadQrCode(data);
          await MediaLibrary.saveToLibraryAsync(filename);
          Toast.show({ type: 'success', text1: 'Yay! QR Code saved successfully' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Save Failed' });
        }
      });
    }
  }, [downloadQrCode]);

  const onPressShare = useCallback(() => {
    if (qrRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      qrRef.current?.toDataURL(async (data: string) => {
        try {
          const filename = await downloadQrCode(data);
          const message = t('Scan the QR code to transfer me Vivicoins');
          const result = await Share.share({
            message: Platform.OS === 'ios' ? message : qrUrl,
            url: filename,
            title: message,
          });
          if (Platform.OS === 'ios' && result.action === Share.sharedAction) {
            Toast.show({ text1: 'Yay! QR Code shared successfully', type: 'success' });
          }
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Share Failed' });
        }
      });
    }
  }, [downloadQrCode, qrUrl, t]);

  useEffect(() => {
    if (loggedInUser.profileImageUri) fetchProfileImage();
  }, [fetchProfileImage, loggedInUser?.profileImageUri]);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: '',
      headerShadowVisible: false,
      headerTintColor: Colors[colorScheme].text,
      headerRight: () => (
        <TouchableOpacity onPress={onPressShare}>
          <Ionicons name="ios-ellipsis-horizontal" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      ),
    });
  }, [colorScheme, navigation, onPressShare]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <MyImage
            style={styles.avatar}
            uri={loggedInUser.profileImageUri}
            params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
            defaultSource={DefaultProfilePicture}
            cacheDisabled
          />
          <View style={styles.nameContainer}>
            <MyText style={styles.userNameText}>{loggedInUser?.username}</MyText>
            <MyText style={{ ...styles.branchNameText, color: Colors[colorScheme].textSecondary }}>{loggedInUser?.branch?.name || '-'}</MyText>
          </View>
        </View>
        <View style={{ marginVertical: 48 }}>
          <QRCode
            getRef={(c) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              qrRef.current = c;
            }}
            size={QR_SIZE}
            color={Colors[colorScheme].text}
            backgroundColor={Colors[colorScheme].secondaryBackground}
            value={qrUrl}
            logoSize={56}
            logo={profileImageSrc}
            logoBackgroundColor="#fff"
            logoBorderRadius={8}
            logoMargin={4}
          />
        </View>
        <MyText style={styles.personaliseNote}>{t('Scan the QR code to transfer me Vivicoins')}</MyText>
      </View>
      <View style={{ ...styles.footer, height: styles.footer.height + insets.bottom, paddingBottom: insets.bottom }}>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, { borderRightColor: '#aaa', borderRightWidth: 1 }]}
            onPress={() => navigation.navigate('CameraScannerScreen')}
          >
            <MyText style={{ fontSize: 16, color: Colors[colorScheme].tint }}>{t('Scan')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { borderRightColor: '#aaa', borderRightWidth: 1 }]} onPress={onPressSave}>
            <MyText style={{ fontSize: 16, color: Colors[colorScheme].tint }}>{t('Save Image')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onPressShare}>
            <MyText style={{ fontSize: 16, color: Colors[colorScheme].tint }}>{t('Share QR')}</MyText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MyQRScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: QR_SIZE + 48,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 60,
  },
  nameContainer: {
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: '100%',
  },
  userNameText: {
    fontSize: 18,
  },
  branchNameText: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '400',
  },
  scanQRText: {
    fontSize: 20,
    textAlign: 'center',
  },
  personaliseNote: {
    fontWeight: '400',
    fontSize: 12,
    color: '#666',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  footer: {
    width: '100%',
    height: 72,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  button: {
    paddingHorizontal: 18,
  },
});
