import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import defaultProfileCover from 'rn-viviboom/assets/images/default-profile-cover.png';
import defaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import ExplorerPicture from 'rn-viviboom/assets/images/explorer.png';
import VivinautPicture from 'rn-viviboom/assets/images/vivinaut.png';
import Colors from 'rn-viviboom/constants/Colors';
import { UserStatusType } from 'rn-viviboom/enums/UserStatusType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';

const screen = Dimensions.get('screen');

const DEFAULT_COVER_IMAGE_WIDTH = 512;
const DEFAULT_PROFILE_IMAGE_SIZE = 256;

const coverImageHeight = screen.height * 0.18;
const nameAndAvatarContainerHeight = 75;

export const userProfileTopBannerHeight = coverImageHeight + nameAndAvatarContainerHeight;

interface IProps {
  user: User;
  isEdit: boolean;
  profileImageToUpload?: string;
  coverImageToUpload?: string;
}

export default function UserProfileTopBanner({ user, isEdit, profileImageToUpload, coverImageToUpload }: IProps) {
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isRootEnv = useReduxStateSelector((s) => s?.account?.institutionId === 1);

  return (
    <View style={styles.container}>
      <MyImage
        style={styles.coverImage}
        uri={coverImageToUpload || user.coverImageUri}
        params={{ width: DEFAULT_COVER_IMAGE_WIDTH }}
        defaultSource={defaultProfileCover}
        cacheDisabled
      />
      <View style={[styles.nameAndAvatarContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <TouchableOpacity style={styles.avatarContainer} activeOpacity={1} onPress={() => navigation.navigate('MemberScreen', { preloadedData: user })}>
          <MyImage
            style={styles.avatar}
            uri={profileImageToUpload || user.profileImageUri}
            params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
            defaultSource={defaultProfilePicture}
            cacheDisabled
          />
        </TouchableOpacity>
        <View style={styles.nameContainer}>
          <MyText style={styles.nameText}>{`${user.name}`}</MyText>
          {isRootEnv && (
            <TouchableOpacity style={styles.statusContainer} onPress={() => navigation.navigate('StarterCriteriaScreen')}>
              <View style={styles.statusTextContainer}>
                <MyText style={styles.statusText}>{user.status ?? '-'}</MyText>
              </View>
              <MyImage defaultSource={user.status === UserStatusType.VIVINAUT ? VivinautPicture : ExplorerPicture} style={styles.statusPicture} uri={''} />
            </TouchableOpacity>
          )}
        </View>
        {!isEdit && (
          <TouchableOpacity style={{ marginHorizontal: 15 }} onPress={() => navigation.navigate('UserProfileEditScreen')}>
            <Ionicons name="create-outline" size={28} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screen.width,
  },
  coverImage: {
    height: coverImageHeight,
    width: screen.width,
    resizeMode: 'cover',
  },
  nameAndAvatarContainer: {
    height: nameAndAvatarContainerHeight,
    overflow: 'visible',
    alignItems: 'center',
    paddingLeft: 18,
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    marginLeft: 16,
    flexWrap: 'wrap',
    flex: 1,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  statusPicture: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusTextContainer: {
    marginRight: 4,
    backgroundColor: '#eee',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: Platform.OS === 'android' ? 0 : 2,
  },
  statusText: {
    fontWeight: '400',
    fontSize: 13,
    color: '#333',
  },
  nameText: {
    fontSize: 15,
    marginVertical: 3,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
});
