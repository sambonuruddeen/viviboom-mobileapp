import { CameraCapturedPicture } from 'expo-camera';
import { isDevice } from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MyButton from 'rn-viviboom/hoc/MyButton';
import MyCamera from 'rn-viviboom/hoc/MyCamera';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

import DraftProjectList from '../DraftProjectList';
import AddProjectMediaHeader from './AddProjectMediaHeader';

export default function AddProjectMediaScreen({ navigation }: RootStackScreenProps<'AddProjectMediaScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });

  const insets = useSafeAreaInsets();
  const [headerTabKey, setHeaderTabKey] = useState('New');
  const [isProcessingMeida, setIsProcessingMedia] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const onBackPressed = () => {
    CreateProjectReduxActions.clearAll();
    navigation.pop();
  };

  const onChangeHeaderTab = useCallback((key: string) => {
    setHeaderTabKey(key);
  }, []);

  const launchCamera = async () => {
    const permissionResponse = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResponse.granted) {
      return;
    }
    setIsProcessingMedia(true);
    try {
      const mediaDetails = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        videoMaxDuration: 60,
      });

      if (!mediaDetails.canceled) {
        await CreateProjectReduxActions.bulkAddMedia(mediaDetails.assets);

        // navigate to next step after selection
        navigation.navigate('MediaCarouselScreen');
      }
    } catch (err) {
      // simulator has no camera
      console.warn(err);
    }
    setIsProcessingMedia(false);
  };

  const launchMediaLibrary = async () => {
    const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResponse.granted) {
      return;
    }
    setIsProcessingMedia(true);
    try {
      const mediaDetails = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: isDevice,
        orderedSelection: true,
        selectionLimit: 10,
      });
      if (!mediaDetails.canceled) {
        await CreateProjectReduxActions.bulkAddMedia(mediaDetails.assets);
        navigation.navigate('MediaCarouselScreen');
      }
    } catch (err) {
      console.warn(err);
    }
    setIsProcessingMedia(false);
  };

  const onPictureSaved = async (picture: CameraCapturedPicture) => {
    await CreateProjectReduxActions.bulkAddMedia([{ ...picture, type: 'image' }]);
    // navigate to next step after selection
    navigation.navigate('MediaCarouselScreen');
  };

  const onVideoSaved = async (video: { uri: string; width: number; height: number }) => {
    await CreateProjectReduxActions.bulkAddMedia([{ ...video, type: 'video' }]);
    // navigate to next step after selection
    navigation.navigate('MediaCarouselScreen');
  };

  useEffect(() => {
    setShowCamera(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <AddProjectMediaHeader onBackPressed={onBackPressed} onChangeHeaderTab={onChangeHeaderTab} headerTabKey={headerTabKey} />
      {headerTabKey === 'New' && (
        <View style={styles.buttonsContainer}>
          {isProcessingMeida ? (
            <ActivityIndicator color="#fff" size={48} />
          ) : (
            <>
              <MyButton style={styles.mediaButton} onPress={() => setShowCamera(true)}>
                Take a Photo
              </MyButton>
              <MyButton style={styles.mediaButton} onPress={launchMediaLibrary}>
                Choose from Library
              </MyButton>
            </>
          )}
        </View>
      )}
      {headerTabKey === 'Draft' && (
        <View style={styles.draftContainer}>
          <DraftProjectList />
        </View>
      )}
      {showCamera && (
        <View style={[styles.cameraContainer, { top: styles.cameraContainer.top + insets.top }]}>
          <MyCamera
            show={showCamera}
            handleClose={() => setShowCamera(false)}
            onPictureSaved={onPictureSaved}
            onVideoSaved={onVideoSaved}
            onLaunchSystemCamera={launchCamera}
            onLaunchMediaLibrary={launchMediaLibrary}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  buttonsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButton: {
    margin: 20,
    backgroundColor: '#fff',
  },
  draftContainer: {
    flex: 1,
    width: '100%',
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
