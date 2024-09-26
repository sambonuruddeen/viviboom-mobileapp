import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import RandomizerMachine from 'rn-viviboom/hoc/RandomizerMachine';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import BadgeReduxActions from 'rn-viviboom/redux/badge/BadgeReduxActions';

const DEFAULT_LIMIT = 10;

const BadgeRandomizerTab = memo(() => {
  const { t } = useTranslation('translation', { keyPrefix: 'badges' });
  const user = useReduxStateSelector((s) => s.account);
  const navigation = useNavigation();
  const offlineData = useReduxStateSelector((s) => s?.badge.randomizerItems || []);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [isFetchingBadges, setFetchingBadges] = useState(false);

  const [isRandomizing, setRandomizing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge>(null);

  const onRandomizingEnd = (resultBadge: Badge) => {
    setRandomizing(false);
    setSelectedBadge(resultBadge);
  };

  const onItemPress = (badge: Badge) => {
    if (badge.isChallenge) {
      navigation.navigate('ChallengeScreen', { preloadedData: badge });
    } else {
      navigation.navigate('BadgeScreen', { preloadedData: badge });
    }
  };

  const fetchBadgeAndChallenges = useCallback(async () => {
    if (isFetchingBadges) return;

    const requestParams = {
      authToken: user?.authToken,
      order: BadgeOrderType.RANDOM,
      limit: DEFAULT_LIMIT,
    };

    setFetchingBadges(true);
    try {
      const badgeRes = await BadgeApi.getList(requestParams);
      const challengeRes = await ChallengeApi.getList(requestParams);
      const badgeAndChallenges = [...badgeRes.data.badges, ...challengeRes.data.challenges];
      setAllBadges(badgeAndChallenges);
      BadgeReduxActions.saveRandomizerItems(badgeAndChallenges);
    } catch (err) {
      console.error(err);
    }
    setFetchingBadges(false);
  }, [isFetchingBadges, user?.authToken]);

  useEffect(() => {
    const init = () => {
      fetchBadgeAndChallenges();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAllBadges(offlineData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <RandomizerMachine items={allBadges} onRandomizingStart={() => setRandomizing(true)} onRandomizingEnd={onRandomizingEnd} onItemPress={onItemPress} />
      <View style={styles.infoContainer}>
        {!isRandomizing && !selectedBadge && (
          <>
            <MyText style={styles.infoText}>{t("Don't know what to do next?")}</MyText>
            <MyText style={styles.infoText}>
              <Trans i18nKey="badges.clickHandle">
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Pull the <MyText style={{ color: 'red' }}>red</MyText> handle for a random quest!
              </Trans>
            </MyText>
          </>
        )}
        {!isRandomizing && !!selectedBadge && (
          <>
            <MyText style={styles.badgeText}>{selectedBadge.name}</MyText>
            <MyButton style={styles.badgeButton} labelStyle={{ marginVertical: 6 }} mode="outlined" onPress={() => onItemPress(selectedBadge)}>
              {t(selectedBadge.isChallenge ? 'View Challenge' : 'View Badge')}
            </MyButton>
          </>
        )}
      </View>
    </View>
  );
});

export default BadgeRandomizerTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    margin: 36,
    height: 72,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    textAlign: 'center',
    margin: 6,
  },
  badgeText: {
    fontSize: 18,
    textAlign: 'center',
  },
  badgeButton: {
    width: 200,
    margin: 12,
    borderRadius: 12,
  },
});
