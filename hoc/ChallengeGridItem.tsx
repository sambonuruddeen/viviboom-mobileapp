import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import ChallengeEarnedPicture from 'rn-viviboom/assets/images/badge-earned.png';
import DefaultChallengePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import Clock from 'rn-viviboom/assets/images/icon-clock.png';
import StarOutline from 'rn-viviboom/assets/images/icon-star-outline.png';
import Star from 'rn-viviboom/assets/images/icon-star.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';
import { calculateDayHourMinutes } from 'rn-viviboom/utils/TimeUtil';

import MyImage from './MyImage';
import MyText from './MyText';

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

const padding = 12;
const imageWidth = Layout.screen.width / 2 - 1.5 * padding;
const imageHeight = (imageWidth / 4) * 3;

const ChallengeGridItem = memo(({ preloadedData, width = imageWidth }: { preloadedData: Badge; width?: number }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'challenges' });
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const account = useReduxStateSelector((s) => s?.account);
  const [challenge, setChallenge] = useState<Badge>(preloadedData);
  const timeToComplete = useMemo(() => {
    const { day, hour, minute } = calculateDayHourMinutes(challenge?.timeToComplete || 0);
    return [day > 0 ? t('d', { count: day }) : null, hour > 0 ? t('hr', { count: hour }) : null, minute > 0 ? t('min', { count: minute }) : null]
      .filter(Boolean)
      .join(' ');
  }, [challenge?.timeToComplete, t]);

  const height = (width / 4) * 3;

  const isEarned = useMemo(() => challenge?.awardedUsers?.find((u) => u.id === account?.id), [account?.id, challenge?.awardedUsers]);

  return (
    <TouchableOpacity
      style={[styles.challengeItemContainer, { width }]}
      onPress={() => navigation.navigate('ChallengeScreen', { preloadedData: challenge })}
      activeOpacity={1}
    >
      <MyImage uri={challenge.imageUri} defaultSource={DefaultChallengePicture} params={challengeParams} style={{ ...styles.challengeImage, width, height }} />
      <View style={{ ...styles.textBackgroundContainer, backgroundColor: Colors[colorScheme].contentBackground }}>
        <MyText style={styles.challengeTitle}>{challenge.name}</MyText>
        <View style={styles.challengeDetails}>
          <View style={{ flexDirection: 'row' }}>
            {!!challenge.difficulty &&
              difficultyLevels[challenge.difficulty].stars.map((star, index) => <Image key={`star-${index}`} style={[styles.logo]} source={star} />)}
          </View>
          <View style={styles.timeContainer}>
            {challenge?.timeToComplete && (
              <>
                <Image style={styles.logo} source={Clock} />
                <MyText style={{ ...styles.descriptionText, color: Colors[colorScheme].text }}>{timeToComplete}</MyText>
              </>
            )}
          </View>
        </View>
      </View>
      {isEarned && <Image source={ChallengeEarnedPicture} style={styles.awardedDescriptionImage} />}
    </TouchableOpacity>
  );
});

export default ChallengeGridItem;

const styles = StyleSheet.create({
  challengeItemContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 8,
    overflow: 'hidden',
    width: imageWidth,
  },
  challengeImage: {
    width: imageWidth,
    height: imageHeight,
  },
  awardedDescriptionImage: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 36,
    fontSize: 12,
  },
  textBackgroundContainer: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    width: '100%',
    height: 80,
    padding: 12,
    justifyContent: 'space-between',
  },
  challengeDetails: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeTitle: {
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 18,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 12,
    height: 12,
  },
  descriptionText: {
    fontWeight: '400',
    fontSize: 11,
    marginLeft: 6,
  },
});
