import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';

import BranchApi from 'rn-viviboom/apis/viviboom/BranchApi';
import Confetti from 'rn-viviboom/assets/animations/confetti.json';
import CompletedIllustration from 'rn-viviboom/assets/images/complete-illustration.png';
import BadgeEarnedPicture from 'rn-viviboom/assets/images/crown.png';
import DefaultBadgePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import StarterBadgePicture from 'rn-viviboom/assets/images/launch.png';
import StarterCriteriaIllustration from 'rn-viviboom/assets/images/starter-criteria-illustration.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import { UserStatusType } from 'rn-viviboom/enums/UserStatusType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';
import AccountReduxActions from 'rn-viviboom/redux/account/AccountReduxActions';
import BadgeReduxActions from 'rn-viviboom/redux/badge/BadgeReduxActions';

const badgeImageParams = { width: 128, suffix: 'png' };
const starterBadgesContainerWidth = 0.77 * Layout.screen.width;
const starterBadgesContainerHeight = 170;
const modalWidth = Math.min(Layout.screen.width - 2 * 18, 500);

const BadgeItem = memo(({ isEarned, badge, onItemPress }: { isEarned: boolean; badge: Badge; onItemPress: () => void }) => {
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity style={styles.badgeItemContainer} onPress={onItemPress}>
      <View style={[styles.badgeImageContainer, { borderColor: isEarned ? '#fbd300' : '#e4e4e4' }]}>
        <MyImage uri={badge.imageUri} defaultSource={DefaultBadgePicture} params={badgeImageParams} style={styles.badgeImage} imageFormat="png" />
        {isEarned && <Image source={BadgeEarnedPicture} style={styles.awardedDescriptionImage} />}
      </View>
      <MyText style={{ ...styles.badgeNameText, color: Colors[colorScheme].textSecondary }}>{badge.name}</MyText>
    </TouchableOpacity>
  );
});

const DEFAULT_LIMIT = 20;

const StarterCriteriaTab = memo(({ isShowing }: { isShowing: boolean }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'badges' });
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((s) => s.account);
  const branch = useReduxStateSelector((s) => s.account?.branch);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const cachedStarterBadges = useReduxStateSelector((s) => s?.badge?.starterBadges || []);
  const cachedStarterChallenges = useReduxStateSelector((s) => s?.badge?.starterChallenges || []);

  const [starterBadges, setStarterBadges] = useState<Badge[]>([]);
  const [isFetchingBadges, setIsFetchingBadges] = useState(false);

  const [starterChallenges, setStarterChallenges] = useState<Badge[]>([]);
  const [isFetchingChallenges, setIsFetchingChallenges] = useState(false);

  const [isFetchingBadgesChallenges, setIsFetchingBadgesChallenges] = useState(false);

  const [hasShowModal, setHasShowModal] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const [isMember, setIsMember] = useState(user.status === UserStatusType.VIVINAUT);
  const [isEnabledStarterCriteria, setisEnabledStarterCriteria] = useState(false);
  const lottieRef = useRef<LottieView>();

  const earnedStarterBadgesCount = useMemo(
    () => starterBadges.reduce((prev, badge) => prev + (badge.awardedUsers?.find((au) => au.id === user.id) ? 1 : 0), 0),
    [starterBadges, user.id],
  );

  const earnedStarterChallengesCount = useMemo(
    () => starterChallenges.reduce((prev, challenge) => prev + (challenge.awardedUsers?.find((au) => au.id === user.id) ? 1 : 0), 0),
    [starterChallenges, user.id],
  );

  const fetchBranchStarterBadges = useCallback(async () => {
    if (isFetchingBadges) return;

    const requestParams = {
      authToken: user?.authToken,
      branchId: user.branchId,
      verboseAttributes: ['awardedUsers'],
      order: BadgeOrderType.LATEST,
      limit: DEFAULT_LIMIT,
      offset: 0,
      isChallenge: false,
    };

    setIsFetchingBadges(true);
    try {
      const res = await BranchApi.getStarterBadgesChallenges(requestParams);
      setStarterBadges(res.data.badges);
      BadgeReduxActions.saveStarterBadges(res.data.badges);
    } catch (err) {
      console.error(err);
    }
    setIsFetchingBadges(false);
  }, [isFetchingBadges, user?.authToken, user.branchId]);

  const fetchBranchStarterChallenges = useCallback(async () => {
    if (isFetchingChallenges) return;

    const requestParams = {
      authToken: user?.authToken,
      branchId: user.branchId,
      verboseAttributes: ['awardedUsers'],
      order: BadgeOrderType.LATEST,
      limit: DEFAULT_LIMIT,
      offset: 0,
      isChallenge: true,
    };

    setIsFetchingChallenges(true);
    try {
      const res = await BranchApi.getStarterBadgesChallenges(requestParams);
      setStarterChallenges(res.data.badges);
      BadgeReduxActions.saveStarterChallenges(res.data.badges);
    } catch (err) {
      console.error(err);
    }
    setIsFetchingChallenges(false);
  }, [isFetchingChallenges, user?.authToken, user.branchId]);

  const fetchBranchStarterBadgesChallenges = async () => {
    await fetchBranchStarterBadges();
    await fetchBranchStarterChallenges();
  };

  const onDismissModal = async () => {
    setModalVisible(false);
    if (isMember && user.status !== UserStatusType.VIVINAUT) {
      await AccountReduxActions.fetch();
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!hasShowModal) {
        setHasShowModal(true);
        setModalVisible(true);
      }
      setStarterBadges(cachedStarterBadges);
      setStarterChallenges(cachedStarterChallenges);
      fetchBranchStarterBadgesChallenges();
    };
    if (isShowing) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowing]);

  useEffect(() => {
    if (
      earnedStarterBadgesCount >= branch?.starterBadgeRequirementCount &&
      earnedStarterChallengesCount >= branch?.starterChallengeRequirementCount &&
      !isMember
    ) {
      // user already a vivinault, fetch and update user status info (to enable tab transition)
      setIsMember(true);
      setModalVisible(true);
    }
  }, [isMember, branch?.starterBadgeRequirementCount, branch?.starterChallengeRequirementCount, earnedStarterBadgesCount, earnedStarterChallengesCount]);

  useEffect(() => {
    if (isMember) lottieRef.current?.play(0);
  }, [isMember]);

  useEffect(() => {
    if (branch?.starterBadgeRequirementCount > 0 || branch?.starterChallengeRequirementCount > 0 || branch?.starterAttendanceRequirementCount > 0) setisEnabledStarterCriteria(true);
  }, [branch?.starterBadgeRequirementCount, branch?.starterChallengeRequirementCount, branch?.starterAttendanceRequirementCount]);

  useEffect(() => {
    if (isFetchingBadges && isFetchingChallenges) setIsFetchingBadgesChallenges(true);
    else setIsFetchingBadgesChallenges(false);
  }, [isFetchingBadges, isFetchingChallenges]);

  const flatListRenderItem = ({ item }: { item: Badge }) => (
    <BadgeItem
      isEarned={!!item?.awardedUsers?.find((au) => au.id === user.id)}
      badge={item}
      onItemPress={() => navigation.navigate('BadgeScreen', { preloadedData: item })}
    />
  );

  const progressBarBackgroundColor = useMemo(() => (colorScheme === 'light' ? '#e4e4e4' : '#323232'), [colorScheme]);

  const flatListHeaderComponent = useMemo(
    () => (
      <View style={[styles.listHeader, { backgroundColor: progressBarBackgroundColor }]}>
        <View style={[styles.listHeaderInnerContainer, { backgroundColor: Colors[colorScheme].background }]}>
          {isEnabledStarterCriteria && (
            <View style={styles.listHeaderContentContainer}>
              <Image source={StarterBadgePicture} style={styles.launchImage} />
              <MyText style={{ ...styles.title, color: Colors[colorScheme].textSecondary }}>
                {isMember ? 'Yes! You are an official VIVINAUT' : 'Complete the requirements to be a VIVINAUT!'}
              </MyText>
            </View>
          )}
          {earnedStarterBadgesCount < branch?.starterBadgeRequirementCount && (
            <>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={
                    (earnedStarterChallengesCount + earnedStarterBadgesCount) /
                    (branch.starterChallengeRequirementCount + branch.starterBadgeRequirementCount || 1)
                  }
                  color="#fbd300"
                  style={[styles.progressBar, { backgroundColor: progressBarBackgroundColor }]}
                />
                <MyText style={styles.progressText}>
                  {earnedStarterBadgesCount + earnedStarterChallengesCount}/{branch.starterBadgeRequirementCount + branch.starterChallengeRequirementCount}
                </MyText>
                <Image source={BadgeEarnedPicture} style={styles.awardedImage} />
              </View>
            </>
          )}
        </View>
      </View>
    ),
    [
      progressBarBackgroundColor,
      colorScheme,
      earnedStarterBadgesCount,
      branch?.starterBadgeRequirementCount,
      branch?.starterChallengeRequirementCount,
      earnedStarterChallengesCount,
      isEnabledStarterCriteria,
      isMember,
    ],
  );

  const ListEmptyComponent = useMemo(() => <MyText style={styles.noItemFoundText}>No starter badges and challenges found</MyText>, []);

  return (
    <>
      <FlatList
        data={[...starterBadges, ...starterChallenges]}
        renderItem={flatListRenderItem}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={flatListHeaderComponent}
        ListFooterComponent={() => isFetchingBadgesChallenges && <ActivityIndicator size="large" style={{ margin: 50 }} />}
        keyExtractor={(item) => `select-badge_${item.id}`}
        refreshing={isFetchingBadgesChallenges}
        numColumns={2}
        contentContainerStyle={{
          width: starterBadgesContainerWidth,
          marginHorizontal: (Layout.screen.width - starterBadgesContainerWidth) / 2,
        }}
        style={{ backgroundColor: Colors[colorScheme].background }}
        onRefresh={fetchBranchStarterBadgesChallenges}
      />
      <TouchableOpacity style={styles.helpButton} onPress={() => setModalVisible(true)}>
        <Feather name="help-circle" size={32} color="#666" />
      </TouchableOpacity>
      <Modal visible={isModalVisible} hardwareAccelerated animationType={'slide'} onRequestClose={onDismissModal} transparent>
        <TouchableOpacity style={styles.centeredView} onPress={onDismissModal} activeOpacity={1}>
          <View style={[styles.modalContentContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
            {!isMember ? (
              <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].contentBackground }]}>
                <Image source={StarterCriteriaIllustration} style={styles.illustration} />
                <MyText style={{ textAlign: 'center', fontSize: 18, margin: 8 }}>Create Projects! Complete Challenges! Earn Badges!</MyText>
                <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                  <MyText
                    style={{ fontSize: 18, color: Colors[colorScheme].textSecondary, margin: 6, lineHeight: 24, fontWeight: '400', textAlign: 'justify' }}
                  >
                    Welcome to VIVITA! Start exploring our space by checking out these popular badges and challenges!
                  </MyText>
                  <MyText
                    style={{ fontSize: 18, color: Colors[colorScheme].textSecondary, margin: 6, lineHeight: 24, fontWeight: '400', textAlign: 'justify' }}
                  >
                    Try completing at least{' '}
                    {branch?.starterBadgeRequirementCount > 0 && (
                      <MyText style={{ color: Colors[colorScheme].tint }}>{t('badge', { count: branch?.starterBadgeRequirementCount })}</MyText>
                    )}{' '}
                    ,{' '}
                    {branch?.starterChallengeRequirementCount > 0 && (
                      <MyText style={{ color: Colors[colorScheme].tint }}>{t('challenge', { count: branch?.starterChallengeRequirementCount })}</MyText>
                    )}{' '}
                    , and attending at least{' '}
                    {branch?.starterAttendanceRequirementCount > 0 && (
                      <MyText style={{ color: Colors[colorScheme].tint }}>{t('event', { count: branch?.starterAttendanceRequirementCount })}</MyText>
                    )}{' '}
                    to become VIVINAUT.
                  </MyText>
                </View>
                <TouchableOpacity style={styles.topButton} onPress={onDismissModal} activeOpacity={1}>
                  <Ionicons name="ios-close-outline" size={24} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].contentBackground }]}>
                <Image source={CompletedIllustration} style={styles.illustration} />
                <MyText style={{ textAlign: 'center', fontSize: 24, margin: 8 }}>Congratulations!</MyText>
                <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                  <MyText
                    style={{ fontSize: 18, color: Colors[colorScheme].textSecondary, margin: 6, lineHeight: 24, fontWeight: '400', textAlign: 'justify' }}
                  >
                    You are now an official VIVINAUT and welcome to the VIVITA family!
                  </MyText>
                  <MyText
                    style={{ fontSize: 18, color: Colors[colorScheme].textSecondary, margin: 6, lineHeight: 24, fontWeight: '400', textAlign: 'justify' }}
                  >
                    Check out the other badges and challenges now and COLLECT &apos;EM ALL!
                  </MyText>
                </View>
                <TouchableOpacity style={styles.topButton} onPress={onDismissModal} activeOpacity={1}>
                  <Ionicons name="ios-close-outline" size={24} color={Colors[colorScheme].text} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <LottieView ref={lottieRef} loop={false} style={styles.lottieAnimation} speed={2} source={Confetti} />
        </TouchableOpacity>
      </Modal>
    </>
  );
});

export default StarterCriteriaTab;

const styles = StyleSheet.create({
  badgeItemContainer: {
    flex: 0.5,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  badgeImageContainer: {
    borderRadius: 64,
    borderWidth: 8,
    borderColor: '#e4e4e4',
    backgroundColor: '#fff',
  },
  badgeImage: {
    width: 76,
    height: 76,
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
    top: -46,
    left: 19,
    width: 56,
    height: 56,
  },
  listHeader: {
    width: starterBadgesContainerWidth - 2 * 18,
    borderRadius: 12,
    marginHorizontal: 18,
    marginTop: 48,
    marginBottom: 32,
    height: starterBadgesContainerHeight,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  listHeaderInnerContainer: {
    width: starterBadgesContainerWidth - 2 * 22,
    height: starterBadgesContainerHeight - 10,
    paddingVertical: 18,
    marginTop: 4,
    alignItems: 'center',
    borderRadius: 10,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    position: 'absolute',
    top: 50,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  launchImage: {
    position: 'relative',
    top: -48,
    width: 84,
    height: 84,
  },
  listHeaderContentContainer: {
    alignItems: 'center',
    height: 96,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: 30,
    alignItems: 'center',
  },
  awardedImage: {
    width: 56,
    height: 56,
    position: 'absolute',
    top: -18,
    left: -9,
  },
  progressBar: {
    width: starterBadgesContainerWidth - 172,
    height: 18,
    borderRadius: 10,
    marginLeft: 26,
    marginTop: 7,
  },
  progressText: {
    marginTop: 5,
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 18,
    color: '#666',
    letterSpacing: 1,
  },
  helpButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 36,
    fontSize: 12,
  },
  // modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContentContainer: {
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: modalWidth,
  },
  illustration: {
    width: 240,
    height: 240,
    resizeMode: 'contain',
  },
  modalContent: {
    borderRadius: 6,
    padding: 18,
    alignItems: 'center',
  },
  topButton: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  lottieAnimation: {
    position: 'absolute',
    width: Layout.screen.width,
    height: Layout.screen.height,
  },
});
