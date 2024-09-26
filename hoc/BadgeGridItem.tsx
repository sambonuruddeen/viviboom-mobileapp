import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ImageRequireSource, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import BadgeEarnedPicture from 'rn-viviboom/assets/images/badge-earned.png';
import DefaultBadgePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyImage from './MyImage';
import MyText from './MyText';

const DefaultBadgePictureTyped = DefaultBadgePicture as ImageRequireSource;

const badgeImageParams = { width: 128, suffix: 'png' };
const backgroundImageParams = { width: 128 };

interface IProps {
  id?: number;
  preloadedData: Badge;
  largeIcon?: boolean;
}

const BadgeGridItem = memo(({ id, preloadedData, largeIcon }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'badges' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const isRootEnv = account.institutionId === 1;
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [badge, setBadge] = useState<Badge>(preloadedData);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string>(badge.coverImageUri);
  const [projectCount, setProjectCount] = useState(0);

  const onItemPress = () => navigation.navigate('BadgeScreen', { preloadedData: badge });

  // API calls
  const fetchBadgeProjectInfo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const projectRes = await ProjectApi.getList({ authToken: account?.authToken, badgeId: id, limit: 1, order: ProjectOrderType.OLDEST });
      setBackgroundImageUri(projectRes.data?.projects?.[0]?.thumbnailUri);
      setProjectCount(projectRes.data.count);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [id, account?.authToken]);

  useEffect(() => {
    fetchBadgeProjectInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAwarded = useMemo(() => badge?.awardedUsers?.find((u) => u.id === account?.id), [account?.id, badge?.awardedUsers]);

  if (!badge) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (largeIcon) {
    return (
      <TouchableOpacity style={styles.badgeItemContainer} onPress={onItemPress}>
        <View>
          <MyImage uri={badge.imageUri} defaultSource={DefaultBadgePicture} params={badgeImageParams} style={styles.badgeImageLarge} imageFormat="png" />
          {isAwarded && <Image source={BadgeEarnedPicture} style={styles.awardedDescriptionImage} />}
        </View>
        <MyText style={{ ...styles.badgeNameText, color: Colors[colorScheme].textSecondary }}>{badge.name}</MyText>
      </TouchableOpacity>
    );
  }

  return (
    <Pressable style={styles.container} onPress={onItemPress}>
      <View style={styles.background}>
        {!!backgroundImageUri && <MyImage uri={backgroundImageUri} params={backgroundImageParams} style={styles.backgroundImage} />}
      </View>
      <View style={styles.badgeImageContainer}>
        <MyImage uri={badge.imageUri} defaultSource={DefaultBadgePictureTyped} params={badgeImageParams} style={styles.badgeImage} imageFormat="png" />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.badgeTextContainer}>
          <MyText style={styles.titleText} numberOfLines={2}>
            {badge?.name}
          </MyText>
          <MyText style={styles.descriptionText} numberOfLines={2}>
            {badge?.description}
          </MyText>
        </View>
        <MyText style={styles.descriptionText} numberOfLines={1}>
          {badge?.awardedUsers?.length && projectCount
            ? `${t(isRootEnv ? 'VIVINAUT' : 'Creator', { count: badge.awardedUsers.length })}  |  ${t('project', { count: projectCount })}`
            : ''}
          {badge?.awardedUsers?.length && !projectCount ? `${t(isRootEnv ? 'VIVINAUT' : 'Creator', { count: badge.awardedUsers.length })}` : ''}
          {!badge?.awardedUsers?.length && projectCount ? `${t('project', { count: projectCount })}` : ''}
        </MyText>
      </View>
      {isAwarded && <MyImage defaultSource={BadgeEarnedPicture} style={styles.awardedImage} />}
    </Pressable>
  );
});

export default BadgeGridItem;

const styles = StyleSheet.create({
  container: {
    margin: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.5)',
    borderRadius: 12,
    width: '100%',
    height: '100%',
  },
  background: {
    width: '100%',
    height: '40%',
    backgroundColor: '#eee',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  badgeImageContainer: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: { width: 62, height: 62, resizeMode: 'contain', borderRadius: 18 },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '36%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  badgeTextContainer: {
    alignItems: 'center',
  },
  titleText: {
    textAlign: 'center',
    fontSize: 13,
    marginHorizontal: 8,
  },
  descriptionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#888',
    marginHorizontal: 12,
    fontWeight: '400',
  },
  awardedImage: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 2,
  },
  badgeItemContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  badgeImageLarge: {
    width: 84,
    height: 84,
    borderRadius: 18,
    margin: 9,
    resizeMode: 'contain',
  },
  badgeNameText: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    marginVertical: 12,
  },
  awardedDescriptionImage: {
    position: 'absolute',
    top: -14,
    right: -14,
    width: 30,
    height: 30,
  },
});
