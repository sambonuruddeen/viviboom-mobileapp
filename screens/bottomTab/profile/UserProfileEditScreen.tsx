/* eslint-disable prettier/prettier *//* eslint-disable linebreak-style */
import { FontAwesome5 } from '@expo/vector-icons';
import { ImagePickerAsset, ImagePickerResult } from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, Dimensions, Keyboard, StyleSheet, TextInput, View } from 'react-native';

import RBSheet from 'react-native-raw-bottom-sheet';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import Colors from 'rn-viviboom/constants/Colors';
import MediaPickerModal from 'rn-viviboom/hoc/MediaPickerModal';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import AccountReduxActions from 'rn-viviboom/redux/account/AccountReduxActions';

import { AxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import UserProfileTopBanner from './UserProfileTopBanner';

const screen = Dimensions.get('screen');

export default function UserProfileEditScreenScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s.account);

  const curPasswordModalRef = useRef<RBSheet>();

  const [isProcessing, setIsProcessing] = useState<boolean>();

  const [changedDescription, setChangedDescription] = useState<string>();
  const [changedGuardianEmail, setChangedGuardianEmail] = useState<string>();
  const [changedPassword, setChangedPassword] = useState<string>();
  const [curPassword, setCurPassword] = useState<string>();

  const [isShowMediaPickerModal, setIsShowMediaPickerModal] = useState(false);
  const [imageUploadType, setImageUploadType] = useState<string>();
  const [profileImageToUpload, setProfileImageToUpload] = useState<ImagePickerAsset>();
  const [coverImageToUpload, setCoverImageToUpload] = useState<ImagePickerAsset>();

  const user = useReduxStateSelector((state) => state.account);

  const onUploadProfileImagePress = (type: string) => {
    setImageUploadType(type);
    setIsShowMediaPickerModal(true);
  };

  const onMediaPicked = (media: ImagePickerResult) => {
    if (!media || media.canceled) return;
    const imageToUpload = media.assets[0];
    if (imageUploadType === 'profile') {
      setProfileImageToUpload(imageToUpload);
    }
    if (imageUploadType === 'cover') {
      setCoverImageToUpload(imageToUpload);
    }
  };

  const onSavePressed = () => {
    let requirePassword = false;
    if (changedGuardianEmail && changedGuardianEmail?.localeCompare(account.guardianEmail)) {
      requirePassword = true;
    }
    if (changedPassword && changedPassword?.localeCompare(account.guardianEmail)) {
      requirePassword = true;
    }
    if (requirePassword) {
      curPasswordModalRef.current.open();
    } else {
      processApi();
    }
  };

  const onConfirmCurPasswordPressed = () => {
    curPasswordModalRef.current.close();
    processApi();
  };

  const processApi = async () => {
    Keyboard.dismiss();
    const data: {
      authToken: string;
      userId: number;
      curPassword?: string;
      guardianEmail?: string;
      newPassword?: string;
      description?: string;
    } = {
      authToken: account?.authToken,
      userId: account?.id,
      curPassword,
    };
    let hasChanges = false;

    if (changedGuardianEmail?.trim().length && changedGuardianEmail?.localeCompare(account.guardianEmail)) {
      hasChanges = true;
      data.guardianEmail = changedGuardianEmail;
    }
    if (changedPassword?.trim().length && changedPassword?.localeCompare(account.guardianEmail)) {
      hasChanges = true;
      data.newPassword = changedPassword;
    }
    if (changedDescription?.trim().length && changedDescription?.localeCompare(account.description)) {
      hasChanges = true;
      data.description = changedDescription;
    }
    if (profileImageToUpload) hasChanges = true;
    if (coverImageToUpload) hasChanges = true;
    if (!hasChanges) {
      navigation.goBack();
      return;
    }
    setIsProcessing(true);
    if (profileImageToUpload) {
      try {
        const { uri } = profileImageToUpload;
        const type = uri.substring(uri.lastIndexOf('.') + 1);
        const file = {
          uri,
          name: 'profile-image',
          type: `image/${type}`,
        };
        await UserApi.putImage({ authToken: account?.authToken, userId: account?.id, file, imageType: 'profile-image' });
      } catch (err) {
        Alert.alert('Error', 'Upload Failed!');
        setIsProcessing(false);
        return;
      }
    }

    if (coverImageToUpload) {
      try {
        const { uri } = coverImageToUpload;
        const type = uri.substring(uri.lastIndexOf('.') + 1);
        const file = {
          uri,
          name: 'cover-image',
          type: `image/${type}`,
        };
        await UserApi.putImage({ authToken: account?.authToken, userId: account?.id, file, imageType: 'cover-image' });
      } catch (err) {
        Alert.alert('Error', 'Upload Failed!');
        setIsProcessing(false);
        return;
      }
    }

    try {
      await UserApi.patch(data);
    } catch (err) {
      const errors = err as AxiosError;
      Alert.alert('Error', errors.message);
    }

    await AccountReduxActions.fetch();
    setIsProcessing(false);
    navigation.goBack();
  };

  const { t } = useTranslation();

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: 'Edit Profile',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  return (
    <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
      <UserProfileTopBanner user={user} isEdit={true} profileImageToUpload={profileImageToUpload?.uri} coverImageToUpload={coverImageToUpload?.uri} />
      <View
        style={{
          flexDirection: 'row',
          marginTop: 36,
          marginHorizontal: 18,
          justifyContent: 'space-between',
        }}
      >
        <MyButton style={styles.uploadImageBtn} labelStyle={styles.uploadImageBtnText} mode="contained" onPress={() => onUploadProfileImagePress('profile')}>
          {t('Change Profile Image')}
        </MyButton>
        <MyButton style={styles.uploadImageBtn} labelStyle={styles.uploadImageBtnText} mode="contained" onPress={() => onUploadProfileImagePress('cover')}>
          {t('Change Cover Image')}
        </MyButton>
      </View>
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <View style={styles.fieldLabelContainer}>
          <MyText style={styles.formLabelTextContainer}>Given Name</MyText>
          <View style={{ ...styles.textInput, backgroundColor: Colors[colorScheme].secondaryBackground }}>
            <TextInput
              editable={false}
              autoCapitalize="none"
              style={{ ...styles.formalLabelText, color: '#aaa' }}
              placeholderTextColor={Colors[colorScheme].text}
              defaultValue={account.givenName}
            />
          </View>
        </View>
        <View style={styles.fieldLabelContainer}>
          <MyText style={styles.formLabelTextContainer}>Family Name</MyText>
          <View style={{ ...styles.textInput, backgroundColor: Colors[colorScheme].secondaryBackground }}>
            <TextInput
              editable={false}
              autoCapitalize="none"
              style={{ ...styles.formalLabelText, color: '#aaa' }}
              placeholderTextColor={Colors[colorScheme].text}
              defaultValue={account.familyName}
            />
          </View>
        </View>
        <View style={styles.fieldLabelContainer}>
          <MyText style={styles.formLabelTextContainer}>Username</MyText>
          <View style={{ ...styles.textInput, backgroundColor: Colors[colorScheme].secondaryBackground }}>
            <TextInput
              editable={false}
              autoCapitalize="none"
              style={{ ...styles.formalLabelText, color: '#aaa' }}
              placeholderTextColor={Colors[colorScheme].text}
              defaultValue={account.username}
            />
          </View>
        </View>
        <View style={styles.fieldLabelContainer}>
          <MyText style={styles.formLabelTextContainer}>Email</MyText>
          <View style={{ ...styles.textInput, backgroundColor: Colors[colorScheme].secondaryBackground }}>
            <TextInput
              autoCapitalize="none"
              style={{ ...styles.formalLabelText, color: Colors[colorScheme].text }}
              placeholderTextColor={Colors[colorScheme].text}
              defaultValue={account.guardianEmail}
              onChangeText={setChangedGuardianEmail}
            />
          </View>
        </View>
        <View style={styles.fieldLabelContainer}>
          <MyText style={styles.formLabelTextContainer}>Password</MyText>
          <View style={{ ...styles.textInput, backgroundColor: Colors[colorScheme].secondaryBackground }}>
            <TextInput
              secureTextEntry
              style={{ ...styles.formalLabelText, color: Colors[colorScheme].text }}
              placeholderTextColor={Colors[colorScheme].text}
              placeholder="••••••••"
              onChangeText={setChangedPassword}
            />
          </View>
        </View>

        <MyText style={{ ...styles.formLabelTextContainer, marginTop: 30 }}>About Me</MyText>
        <View style={{ ...styles.aboutTextInput, backgroundColor: Colors[colorScheme].secondaryBackground }}>
          <TextInput
            autoCapitalize="none"
            multiline
            style={{ marginHorizontal: 16, marginVertical: 8, height: 100, color: Colors[colorScheme].text, textAlignVertical: 'top' }}
            placeholderTextColor={Colors[colorScheme].text}
            defaultValue={account.description}
            onChangeText={setChangedDescription}
          />
        </View>

        <MyButton
          style={{ marginTop: 18, width: '100%', alignSelf: 'center', borderRadius: 15 }}
          contentStyle={{ marginHorizontal: 2 }}
          mode="contained"
          loading={isProcessing}
          onPress={onSavePressed}
        >
          <FontAwesome5 name="save" size={20} />
          <MyText style={{ fontSize: 18, color: Colors[colorScheme].textInverse }}>{`  ${t('Save')}`}</MyText>
        </MyButton>
      </View>
      {/* Input cur password modal */}
      <RBSheet
        ref={curPasswordModalRef}
        height={200}
        customStyles={{ container: { paddingHorizontal: 12, backgroundColor: Colors[colorScheme].contentBackground } }}
      >
        <MyText style={styles.curPasswordTextContainer}>Enter your current password</MyText>
        <View style={{ ...styles.currPasswordInput, backgroundColor: Colors[colorScheme].secondaryBackground }}>
          <TextInput style={styles.formalLabelText} onChangeText={setCurPassword} />
        </View>
        <MyButton
          style={{ marginTop: 18, width: 200, alignSelf: 'center', borderRadius: 15 }}
          contentStyle={{ marginHorizontal: 2 }}
          mode="contained"
          onPress={onConfirmCurPasswordPressed}
          loading={isProcessing}
        >
          <FontAwesome5 name="save" size={20} />
          <MyText style={{ fontSize: 18, color: Colors[colorScheme].textInverse }}>{`  ${t('Confirm')}`}</MyText>
        </MyButton>
      </RBSheet>
      {/* Media picker modal */}
      <MediaPickerModal mediaType="photo" isShow={isShowMediaPickerModal} onMediaPicked={onMediaPicked} onClose={() => setIsShowMediaPickerModal(false)} />
    </KeyboardAwareScrollView>
  );
}

// function DataURIToBlob(dataURI: string) {
//   const splitDataURI = dataURI.split(',');
//   const byteString = splitDataURI[0].indexOf('base64') >= 0 ? atob(splitDataURI[1]) : decodeURI(splitDataURI[1]);
//   const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

//   const ia = new Uint8Array(byteString.length);
//   for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

//   return new Blob([ia], { type: mimeString });
// }

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    margin: 18,
    borderRadius: 18,
    elevation: 2,
    shadowRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    padding: 12,
  },
  formLabelTextContainer: {
    marginTop: 12,
    marginLeft: 10,
    width: '30%',
  },
  curPasswordTextContainer: {
    marginTop: 12,
    marginLeft: 10,
    width: '60%',
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formalLabelText: {
    marginVertical: 10,
    marginHorizontal: 16,
  },
  textInput: {
    height: 40,
    margin: 12,
    width: '60%',
    borderRadius: 15,
  },
  currPasswordInput: {
    height: 40,
    margin: 12,
    width: '95%',
    borderRadius: 15,
  },
  aboutTextInput: {
    height: 100,
    margin: 12,
    borderRadius: 15,
  },
  uploadImageBtn: {
    padding: null,
    borderRadius: 24,
    paddingVertical: null,
    minWidth: null,
  },
  uploadImageBtnText: {
    fontSize: 11,
    letterSpacing: 0,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  coverImage: {
    height: 140,
    width: screen.width,
    resizeMode: 'cover',
  },
});
