import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef } from 'react';
import { WithTranslation, useTranslation, withTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import RBSheet, { RBSheetProps } from 'react-native-raw-bottom-sheet';
import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import MyButton from './MyButton';
import MyText from './MyText';

interface MediaPickerModalProps extends WithTranslation, RBSheetProps {
  isShow: boolean;
  mediaType: 'photo' | 'video' | 'all';
  onMediaPicked(mediaInfo: ImagePicker.ImagePickerResult): void;
  pickerOptions?: ImagePicker.ImagePickerOptions;
}

function MediaPickerModal({ isShow, pickerOptions = {}, onMediaPicked, ...restOfProps }: MediaPickerModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const rbSheetRef = useRef<RBSheet>();

  useEffect(() => {
    if (isShow) rbSheetRef.current.open();
    else rbSheetRef.current.close();
  }, [isShow]);

  const onUseCameraBtnPress = async () => {
    const permissionResponse = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResponse.granted) {
      return;
    }
    const imgDetails = await ImagePicker.launchCameraAsync({
      allowsEditing: pickerOptions.allowsEditing || true,
      aspect: pickerOptions.aspect,
      base64: pickerOptions.base64 || true,
      quality: pickerOptions.quality || 1,
    });
    rbSheetRef.current.close();
    onMediaPicked(imgDetails);
  };

  const onPickImgFromLibraryBtnPress = async () => {
    const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResponse.granted) {
      return;
    }
    const imgDetails = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: pickerOptions.allowsEditing === undefined,
      mediaTypes: pickerOptions.mediaTypes || ImagePicker.MediaTypeOptions.Images,
      aspect: pickerOptions.aspect,
      base64: pickerOptions.base64 || true,
      quality: pickerOptions.quality || 1,
    });
    rbSheetRef.current.close();
    onMediaPicked(imgDetails);
  };

  return (
    <RBSheet {...restOfProps} height={160} ref={rbSheetRef} customStyles={{ container: { backgroundColor: Colors[colorScheme].contentBackground } }}>
      <MyButton style={[styles.listItem, styles.bottomLine]} onPress={onUseCameraBtnPress}>
        <MyText style={styles.commonText}>{t('Take a photo')}</MyText>
      </MyButton>
      <MyButton style={styles.listItem} onPress={onPickImgFromLibraryBtnPress}>
        <MyText style={styles.commonText}>{t('Choose from library')}</MyText>
      </MyButton>
    </RBSheet>
  );
}

const styles = StyleSheet.create({
  commonText: { fontSize: 18, color: '#1E90FF' },
  listItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 15 },
  bottomLine: { borderBottomWidth: 0.5, borderColor: '#aaa' },
});

export default withTranslation('translation')(MediaPickerModal);
