import { Ionicons } from '@expo/vector-icons';
import { ImagePickerResult } from 'expo-image-picker';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import defaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MediaPickerModal from 'rn-viviboom/hoc/MediaPickerModal';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import AccountReduxActions from 'rn-viviboom/redux/account/AccountReduxActions';

const DEFAULT_PROFILE_IMAGE_SIZE = 256;
const containerSize = Math.min(Layout.screen.width - 2 * 18, 400);

const imagePadding = 12;
const imageSize = containerSize - imagePadding * 2;

export default function AddProfileScreen({ navigation }: RootStackScreenProps<'AddProfileScreen'>) {
  const scanRef = useRef<LottieView>();
  const btnAnim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s.account);

  const [isShowMediaPickerModal, setIsShowMediaPickerModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [profileImageToUpload, setProfileImageToUpload] = useState<string>();

  const onMediaPicked = async (media: ImagePickerResult) => {
    if (!media || media.canceled) return;

    setIsProcessing(true);
    try {
      const { uri, base64 } = media.assets[0];
      const type = uri.substring(uri.lastIndexOf('.') + 1);
      const file = {
        uri,
        name: 'profile-image',
        type: `image/${type}`,
      };
      await UserApi.putImage({ authToken: account?.authToken, userId: account?.id, file, imageType: 'profile-image' });
      setProfileImageToUpload(`data:image/${type};base64,${base64}`);
    } catch (err) {
      console.log(err);
      Toast.show({ text1: 'Profile upload failed! Image might be too large.', type: 'error' });
    }
    setIsProcessing(false);
  };

  const onComplete = async () => {
    await UserApi.patch({ authToken: account.authToken, userId: account.id, isCompletedTutorial: true });
    await AccountReduxActions.fetch();
    navigation.replace('Root');
  };

  const onButtonPress = () => {
    if (isProcessing) return;
    if (profileImageToUpload) onComplete();
    else setIsShowMediaPickerModal(true);
  };

  const animIn = () => {
    Animated.timing(btnAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    scanRef.current?.play(0);
    animIn();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.contentContainer}>
        <View style={styles.topContainer}>
          <MyText style={{ fontSize: 20, textAlign: 'center' }}>Add a profile picture if you want to!</MyText>
        </View>
        <View style={styles.animContainer}>
          {profileImageToUpload ? (
            <>
              <View style={styles.avatarContainer}>
                <MyImage
                  style={styles.avatar}
                  uri={profileImageToUpload || account.profileImageUri}
                  params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                  defaultSource={defaultProfilePicture}
                />
              </View>
              {!!profileImageToUpload && (
                <MyButton mode="text" onPress={() => setIsShowMediaPickerModal(true)}>
                  Change
                </MyButton>
              )}
            </>
          ) : (
            <LottieView ref={scanRef} style={styles.scanAnimation} source={require('./assets/info.json')} />
          )}
        </View>
      </View>
      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom, height: styles.footer.height + insets.bottom, opacity: btnAnim }]}>
        <View style={{ flex: 1 }}>
          <MyButton style={{ width: '100%', position: 'absolute', bottom: 12 }} mode="contained" disabled={isProcessing} onPress={onButtonPress}>
            {isProcessing ? 'Uploading...' : `${profileImageToUpload ? 'Done' : 'Add Profile Image'}`}
          </MyButton>
        </View>
      </Animated.View>
      <View style={{ ...styles.header, paddingTop: insets.top, height: styles.header.height + insets.top }}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={onComplete}>
            <Ionicons name="ios-close-outline" size={30} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
        <MyButton compact style={styles.selectButton} labelStyle={{ fontSize: 14 }} mode="text" onPress={onComplete}>
          Skip
        </MyButton>
      </View>
      <MediaPickerModal mediaType="photo" isShow={isShowMediaPickerModal} onMediaPicked={onMediaPicked} onClose={() => setIsShowMediaPickerModal(false)} />
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
  topContainer: {
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
    width: 120,
  },
  selectButton: {
    height: 36,
    marginRight: 10,
    paddingVertical: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  animContainer: {
    width: imageSize,
    height: imageSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAnimation: {
    width: imageSize,
    height: imageSize,
  },
  avatarContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 184,
    height: 184,
    borderRadius: 92,
  },
  footer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: 120,
  },
});
