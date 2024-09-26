import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';

import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import DefaultChallengePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import Clock from 'rn-viviboom/assets/images/icon-clock.png';
import StarOutline from 'rn-viviboom/assets/images/icon-star-outline.png';
import Star from 'rn-viviboom/assets/images/icon-star.png';
import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { calculateDayHourMinutes } from 'rn-viviboom/utils/TimeUtil';

import MyImage from './MyImage';
import MyText from './MyText';

const DefaultChallengePictureTyped = DefaultChallengePicture as ImageRequireSource;

const challengeParams = { width: 256 };

const difficultyLevels: Record<string, { stars: number[]; label: string }> = {
  BEGINNER: {
    stars: [Star, StarOutline, StarOutline] as number[],
    label: 'Beginner',
  },
  INTERMEDIATE: {
    stars: [Star, Star, StarOutline] as number[],
    label: 'Intermediate',
  },
  ADVANCED: {
    stars: [Star, Star, Star] as number[],
    label: 'Advanced',
  },
};

interface IProps {
  id?: number;
  preloadedData: Badge;
}

const ChallengeListItem = memo(({ id, preloadedData }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'challenges' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [challenge, setChallenge] = useState<Badge>(preloadedData);

  // API calls
  const fetchChallenge = useCallback(async () => {
    if (challenge || !id) {
      return;
    }
    setLoading(true);
    try {
      const res = await ChallengeApi.get({
        authToken: account?.authToken,
        challengeId: id,
      });
      setChallenge(res.data?.challenge);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [challenge, id, account?.authToken]);

  useEffect(() => {
    if (preloadedData) setChallenge(preloadedData);
    fetchChallenge();
  }, [preloadedData, fetchChallenge]);

  const timeToComplete = useMemo(() => {
    const { day, hour, minute } = calculateDayHourMinutes(challenge?.timeToComplete || 0);
    return [day > 0 ? t('d', { count: day }) : null, hour > 0 ? t('hr', { count: hour }) : null, minute > 0 ? t('min', { count: minute }) : null]
      .filter(Boolean)
      .join(' ');
  }, [challenge?.timeToComplete, t]);

  return (
    <TouchableOpacity activeOpacity={1} style={styles.container} onPress={() => navigation.navigate('ChallengeScreen', { preloadedData: challenge })}>
      <View style={styles.imageContainer}>
        <MyImage style={styles.image} uri={challenge?.imageUri} params={challengeParams} defaultSource={DefaultChallengePictureTyped} />
      </View>
      <View style={styles.statusContainer}>
        <View style={styles.statusTop}>
          <MyText style={styles.titleText} numberOfLines={2}>
            {challenge?.name}
          </MyText>
          <View style={styles.descriptionContainer}>
            {challenge?.description ? (
              <MyText style={styles.descriptionText} numberOfLines={2}>
                {challenge?.description}
              </MyText>
            ) : null}
          </View>
        </View>
        <View style={styles.statusBottom}>
          <View style={{ flexDirection: 'row' }}>
            {!!challenge.difficulty &&
              difficultyLevels[challenge.difficulty].stars.map((star, index) => <Image key={`star-${index}`} style={[styles.logo]} source={star} />)}
          </View>
          <View style={styles.timeContainer}>
            {challenge?.timeToComplete && (
              <>
                <Image style={styles.logo} source={Clock} />
                <MyText style={{ ...styles.timeText, color: Colors[colorScheme].text }}>{timeToComplete}</MyText>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default ChallengeListItem;

const styles = StyleSheet.create({
  container: {
    margin: 0,
    flexDirection: 'row',
    marginHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.3)',
  },
  imageContainer: {},
  image: {
    borderRadius: 4,
    height: 120,
    width: 160,
  },
  statusContainer: {
    flex: 1,
    marginLeft: 18,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusTop: {},
  dateText: {
    fontSize: 15,
  },
  titleText: {
    fontSize: 18,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: '#aaa',
    width: '100%',
    fontWeight: '400',
  },
  statusBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingStatus: {
    position: 'absolute',
    top: 10,
    right: -6,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#aaa',
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#f2f2f2',
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 18,
    height: 18,
  },
  timeText: {
    fontWeight: '400',
    fontSize: 15,
    marginLeft: 6,
  },
});
