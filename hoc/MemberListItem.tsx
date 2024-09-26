import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useState } from 'react';
import { ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

import MyButton from './MyButton';
import MyImage from './MyImage';
import MyText from './MyText';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;

const DEFAULT_PROFILE_PICTURE_SIZE = 128;

const memberListItemHeight = 72;

interface IProps {
  id?: number;
  preloadedData: User;
  hideStats?: boolean;
  hideLine?: boolean;
  showUsername?: boolean;
  onPress?: () => void;
}

const MemberListItem = memo(({ id, preloadedData, hideStats, hideLine, showUsername, onPress }: IProps) => {
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(false);

  const [member, setMember] = useState<User>(preloadedData);

  // API calls
  const fetchMember = useCallback(async () => {
    if (!id && !preloadedData?.id) return;
    if (member?.branch !== undefined || hideStats) return;
    setLoading(true);
    try {
      const res = await UserApi.get({ authToken: account?.authToken, userId: id || preloadedData?.id });
      setMember(res.data?.user);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [id, preloadedData?.id, member, hideStats, account?.authToken]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  if (!member) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={1} style={styles.container} onPress={onPress || (() => navigation.push('MemberScreen', { preloadedData: member }))}>
      <View style={styles.imageContainer}>
        <MyImage
          uri={member.profileImageUri}
          defaultSource={DefaultProfilePictureTyped}
          params={{ width: DEFAULT_PROFILE_PICTURE_SIZE }}
          style={styles.profileImage}
        />
        {!!member?.branch?.countryISO && (
          <View style={styles.countryImageContainer}>
            <MyImage defaultSource={CountryUtil.getCountryFlag(member?.branch?.countryISO)} style={styles.countryImage} />
          </View>
        )}
      </View>
      <View style={[styles.profiles, { borderBottomWidth: hideLine ? 0 : 0.5 }]}>
        <View style={styles.nameAndDescription}>
          <MyText style={styles.nameText} numberOfLines={1}>
            {member?.name || '-'}
          </MyText>
          <MyText style={styles.descriptionText} numberOfLines={1}>
            {showUsername ? member.username : member.description || ''}
          </MyText>
        </View>
        {hideStats ? (
          <MyButton mode="outlined" compact labelStyle={styles.profileButtonText} style={styles.profileButton}>
            <Ionicons name="ios-ellipsis-horizontal-sharp" size={16} color={Colors[colorScheme].tint} />
          </MyButton>
        ) : (
          <View style={styles.authorStats}>
            <View style={styles.statsContainer}>
              <Ionicons name="ios-ribbon-outline" size={20} color={Colors[colorScheme].textSecondary} />
              <MyText style={styles.statsText}>{getCountDisplay(member?.badgeCount)}</MyText>
            </View>
            <View style={styles.statsContainer}>
              <MaterialCommunityIcons name="puzzle-outline" size={20} color={Colors[colorScheme].textSecondary} />
              <MyText style={styles.statsText}>{getCountDisplay(member?.challengeCount)}</MyText>
            </View>
            <View style={styles.statsContainer}>
              <Ionicons name="ios-reader-outline" size={20} color={Colors[colorScheme].textSecondary} />
              <MyText style={styles.statsText}>{getCountDisplay(member?.projectCount)}</MyText>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default MemberListItem;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: memberListItemHeight,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 12,
  },
  imageContainer: {},
  profileImage: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    borderRadius: memberListItemHeight / 2,
  },
  countryImageContainer: {
    position: 'absolute',
    width: 20,
    height: 20,
    bottom: -1,
    right: -1.5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  countryImage: {
    width: 16,
    height: 16,
    borderRadius: 10,
  },
  profiles: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    borderBottomColor: 'rgba(160, 160, 160, 0.3)',
    borderBottomWidth: 0.5,
    marginHorizontal: 14,
  },
  nameText: {
    fontWeight: '400',
    fontSize: 18,
  },
  descriptionText: {
    fontWeight: '400',
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  nameAndDescription: {
    flex: 1,
    justifyContent: 'center',
  },
  authorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48%',
    minWidth: 108,
    maxWidth: 200,
  },
  statsContainer: {
    flex: 1,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statsText: {
    flex: 1,
    textAlign: 'center',
    marginRight: 4,
    fontSize: 16,
    fontWeight: '400',
  },
  profileButton: {
    borderRadius: 12,
    marginLeft: 6,
    width: 48,
    alignItems: 'center',
  },
  profileButtonText: {
    fontWeight: '500',
    fontSize: 12,
    marginVertical: 2,
    textAlign: 'center',
  },
});

const getCountDisplay = (count?: number) => {
  if (count === 0) return '0';
  if (!count || count < 0) return '-';
  if (count > 99) return '99+';
  return count;
};
