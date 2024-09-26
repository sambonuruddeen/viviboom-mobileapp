import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ImageRequireSource, Pressable, StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import BadgeEarnedPicture from 'rn-viviboom/assets/images/badge-earned.png';
import DefaultBadgePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyButton from './MyButton';
import MyImage from './MyImage';
import MyText from './MyText';

const DefaultBadgePictureTyped = DefaultBadgePicture as ImageRequireSource;
const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const BadgeEarnedPictureTyped = BadgeEarnedPicture as ImageRequireSource;

const badgeImageParams = { width: 256, suffix: 'png' };
const profileImageParams = { width: 64 };

interface IProps {
  id?: number;
  preloadedData: Badge;
  compact?: boolean;
}

const BadgeListItem = memo(({ id, preloadedData, compact }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'badges' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const isRootEnv = account.institutionId === 1;
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [badge, setBadge] = useState<Badge>(preloadedData);

  // API calls
  const fetchBadge = useCallback(async () => {
    if (!id) return;
    if (badge?.awardedUsers !== undefined) return;
    setLoading(true);
    try {
      const res = await BadgeApi.get({ authToken: account?.authToken, badgeId: id, verboseAttributes: ['awardedUsers'] });
      setBadge(res.data?.badge);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [id, badge?.awardedUsers, account?.authToken]);

  useEffect(() => {
    fetchBadge();
  }, [fetchBadge]);

  const awardedUsers = badge?.awardedUsers || [];
  const isAwarded = awardedUsers?.find((u) => u.id === account?.id);

  if (!badge) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (compact) {
    return (
      <Pressable style={styles.container} onPress={() => navigation.navigate('BadgeScreen', { preloadedData: badge })}>
        <View style={{ flexDirection: 'row' }}>
          <MyImage uri={badge.imageUri} defaultSource={DefaultBadgePictureTyped} params={badgeImageParams} style={styles.compactBadgeImage} imageFormat="png" />
          <View style={styles.compactTextContainer}>
            <MyText style={styles.compactTitleText}>{badge?.name}</MyText>
            <MyButton mode="outlined" compact labelStyle={styles.profileButtonText} style={styles.profileButton}>
              <Ionicons name="ios-ellipsis-horizontal-sharp" size={16} color={Colors[colorScheme].tint} />
            </MyButton>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.container} onPress={() => navigation.navigate('BadgeScreen', { preloadedData: badge })}>
      <View style={{ flexDirection: 'row' }}>
        <MyImage uri={badge.imageUri} defaultSource={DefaultBadgePictureTyped} params={badgeImageParams} style={styles.badgeImage} imageFormat="png" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
          <MyText style={styles.titleText}>{badge?.name}</MyText>
          {isAwarded && (
            <View style={styles.awardedDescriptionContainer}>
              <MyImage defaultSource={BadgeEarnedPictureTyped} style={styles.awardedDescriptionImage} />
              <MyText style={styles.awardedDescriptionText}>{"Yay! You've earned this badge"}</MyText>
            </View>
          )}
        </View>
      </View>
      <View style={styles.horizontalLine} />
      <View style={styles.awardedUsersContainer}>
        {!!awardedUsers.length && (
          <View style={{ flexDirection: 'row' }}>
            {awardedUsers?.slice(-10).map((v) => (
              <View key={`awarded-user_${v.id}`} style={styles.awardedUsersAvatar}>
                <MyImage uri={v.profileImageUri} defaultSource={DefaultProfilePictureTyped} params={profileImageParams} style={styles.awardedUsersAvatar} />
              </View>
            ))}
            {!!awardedUsers.length && awardedUsers.length > 10 && (
              <View style={styles.awardedUsersAvatar}>
                <Feather size={24} style={{ textAlign: 'center', marginTop: 2 }} name="more-horizontal" />
              </View>
            )}
          </View>
        )}
        <MyText style={styles.awardedUsersText}>{t(isRootEnv ? 'earnBadge' : 'earnBadgeCreator', { count: awardedUsers.length })}</MyText>
      </View>
    </Pressable>
  );
});

export default BadgeListItem;

const styles = StyleSheet.create({
  container: {},
  compactBadgeImage: { width: 56, height: 56, alignSelf: 'center', resizeMode: 'contain', margin: 12, borderRadius: 18 },
  badgeImage: { width: 80, height: 80, alignSelf: 'center', resizeMode: 'contain', margin: 12 },
  awardedDescriptionContainer: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', marginRight: 26, marginTop: 4 },
  awardedDescriptionImage: { width: 24, height: 24, marginRight: 2 },
  awardedDescriptionText: { textAlign: 'center', color: '#f4b409' },
  awardedUsersContainer: { margin: 12 },
  awardedUsersAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
  },
  awardedUsersText: { color: '#a2a2a2', textAlign: 'center', marginTop: 8 },
  titleText: { textAlign: 'center', fontSize: 18, fontWeight: '500' },
  compactTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    borderBottomColor: 'rgba(160, 160, 160, 0.2)',
    borderBottomWidth: 0.5,
  },
  compactTitleText: { fontSize: 16, fontWeight: '500', flex: 1 },
  profileButton: {
    borderRadius: 12,
    marginLeft: 6,
    width: 48,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#7353ff',
    fontWeight: '500',
    fontSize: 12,
    marginVertical: 2,
    textAlign: 'center',
  },
  horizontalLine: { flex: 1, borderTopWidth: 0.2, borderColor: '#a2a2a2' },
});
