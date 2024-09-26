/* eslint-disable no-underscore-dangle */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ColorSchemeName, Dimensions, Image, ImageRequireSource, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationState, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultBackgroundPicture from 'rn-viviboom/assets/images/banner-bg.png';
import DefaultChallengePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import Categories from 'rn-viviboom/assets/images/icon-categories.png';
import Clock from 'rn-viviboom/assets/images/icon-clock.png';
import StarOutline from 'rn-viviboom/assets/images/icon-star-outline.png';
import Star from 'rn-viviboom/assets/images/icon-star.png';
import Colors from 'rn-viviboom/constants/Colors';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import { calculateDayHourMinutes } from 'rn-viviboom/utils/TimeUtil';

import ChallengeAboutTab from './ChallengeAboutTab';
import ChallengeBadgesTab from './ChallengeBadgesTab';
import ChallengeHeader from './ChallengeHeader';
import ChallengeProjectTab from './ChallengeProjectTab';
import { backgroundHeight, headerHeight, tabBarHeight } from './constants';

const DefaultChallengePictureTyped = DefaultChallengePicture as ImageRequireSource;

const challengeImageParams = { width: 256, suffix: 'png' };
const backgroundImageParams = { width: 256 };

const screen = Dimensions.get('screen');

const ChallengeScreenColours: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    secondaryBackground: '#f2f2f2',
    tagBackground: '#eee',
  },
  dark: {
    secondaryBackground: '#000',
    tagBackground: '#333',
  },
};

/* refer to https://medium.com/@linjunghsuan/implementing-a-collapsible-header-with-react-native-tab-view-24f15a685e07 for implementation of collapsible header */

const routes = [
  { key: 'About', title: 'About' },
  { key: 'Projects', title: 'Projects' },
  { key: 'Skill Badges', title: 'Skill Badges' },
];

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

type SceneProps = SceneRendererProps & {
  route: {
    key: string;
    title: string;
  };
};

const tabWidth = screen.width / routes.length;

const MyTabBar = (
  props: SceneRendererProps & {
    navigationState: NavigationState<{
      key: string;
      title: string;
    }>;
    scrollY: Animated.Value;
  },
) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isRootEnv = useReduxStateSelector((s) => s.account.institutionId === 1);

  const translateY = props.scrollY.interpolate({
    inputRange: [-500, backgroundHeight - headerHeight],
    outputRange: [backgroundHeight + insets.top + 500, headerHeight + insets.top],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View style={{ position: 'absolute', transform: [{ translateY }], top: 0, zIndex: 5, width: '100%' }}>
      <TabBar
        {...props}
        indicatorStyle={{ backgroundColor: Colors[colorScheme].tint, width: 50, left: (tabWidth - 50) / 2 }}
        style={{ backgroundColor: Colors[colorScheme].contentBackground, height: tabBarHeight }}
        renderLabel={({ route, focused }) => (
          <MyText style={{ color: focused ? Colors[colorScheme].text : Colors[colorScheme].textInactive, fontWeight: '500', marginBottom: 10 }}>
            {route.title === 'Vivinauts' && !isRootEnv ? 'Creators' : route.title}
          </MyText>
        )}
      />
    </Animated.View>
  );
};

export default function ChallengeScreen({ navigation, route }: RootStackScreenProps<'ChallengeScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'challenges' });
  const colorScheme = useColorScheme();
  const { preloadedData } = route.params;
  const user = useReduxStateSelector((state) => state.account);
  const isRootEnv = user.institutionId === 1;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [isChallengeLoading, setIsChallengeLoading] = useState(true);
  const [challenge, setChallenge] = useState(preloadedData);
  const [backgroundImageUri, setBackgroundImageUri] = useState<string>();
  const [projectCount, setProjectCount] = useState(0);

  const [tab, setTab] = useState(0); // tab index

  const listOffset = useRef<Record<string, number>>({});
  const listRefs = useRef<Record<string, ScrollView>>({});

  useEffect(() => {
    scrollY.addListener(({ value }) => {
      const curRoute = routes[tab].key;
      listOffset.current[curRoute] = value;
    });

    return () => {
      scrollY.removeAllListeners();
    };
  }, [tab]);

  const syncScrollOffset = () => {
    const topHeight = backgroundHeight - headerHeight;
    const curRouteKey = routes[tab].key;

    routes.forEach(({ key }) => {
      // sync value except current route
      if (key !== curRouteKey) {
        // if header has not yet been collapsed, scroll to current offset
        const currentRef = listRefs.current[key];
        const scrollValue = Math.max(0, scrollY._value);
        if (scrollValue < topHeight) {
          if (currentRef) {
            if (key !== 'Projects') {
              currentRef.scrollTo({
                y: scrollValue,
                animated: false,
              });
            } else {
              currentRef.scrollToOffset({
                offset: scrollValue,
                animated: false,
              });
            }
            listOffset.current[key] = scrollValue;
          }
          // if header has been collapsed, scroll to HeaderHeight
        } else if (scrollValue >= topHeight) {
          if (!listOffset.current[key] || listOffset.current[key] < topHeight) {
            if (currentRef) {
              if (key !== 'Projects') {
                currentRef.scrollTo({
                  y: topHeight,
                  animated: false,
                });
              } else {
                currentRef.scrollToOffset({
                  offset: topHeight,
                  animated: false,
                });
              }
              listOffset.current[key] = topHeight;
            }
          }
        }
      }
    });
  };

  const Scene = ({ route: tabRoute }: SceneProps) => {
    switch (tabRoute.key) {
      case 'About':
        return (
          <ChallengeAboutTab
            challenge={challenge}
            scrollY={scrollY}
            ref={(ref) => {
              listRefs.current[tabRoute.key] = ref;
            }}
            onScrollEnd={syncScrollOffset}
          />
        );
      case 'Projects':
        return (
          <ChallengeProjectTab
            challenge={challenge}
            scrollY={scrollY}
            ref={(ref) => {
              listRefs.current[tabRoute.key] = ref;
            }}
            onScrollEnd={syncScrollOffset}
          />
        );
      case 'Skill Badges':
        return (
          <ChallengeBadgesTab
            challenge={challenge}
            scrollY={scrollY}
            ref={(ref) => {
              listRefs.current[tabRoute.key] = ref;
            }}
            onScrollEnd={syncScrollOffset}
          />
        );
      default:
        return <View />;
    }
  };

  // API calls
  const fetchChallenge = useCallback(async () => {
    setIsChallengeLoading(true);
    try {
      const res = await ChallengeApi.get({
        authToken: user?.authToken,
        challengeId: preloadedData?.id,
        verboseAttributes: ['awardedUsers', 'categories', 'createdByUser', 'challengeBadges'],
      });
      const projectRes = await ProjectApi.getList({ authToken: user?.authToken, badgeId: preloadedData?.id, limit: 1, order: ProjectOrderType.OLDEST });
      setChallenge(res.data?.challenge);
      setBackgroundImageUri(challenge?.coverImageUri || projectRes.data?.projects?.[0]?.thumbnailUri);
      setProjectCount(projectRes.data.count);
    } catch (err) {
      console.log(err);
    }
    setIsChallengeLoading(false);
  }, [challenge?.coverImageUri, preloadedData?.id, user?.authToken]);

  const onBackPressed = () => {
    navigation.pop();
  };

  useEffect(() => {
    // scrollRef.current?.scrollTo({ y: 0 });
    fetchChallenge();
  }, [challenge?.id, fetchChallenge]);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, backgroundHeight + insets.top],
    outputRange: [0, -(backgroundHeight + insets.top)],
    extrapolateRight: 'clamp',
  });

  const backgroundTranslateY = scrollY.interpolate({
    inputRange: [0, backgroundHeight + insets.top],
    outputRange: [0, -(backgroundHeight + insets.top)],
    extrapolate: 'clamp',
  });

  const backgroundBottom = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [-50, 0],
    extrapolateRight: 'clamp',
  });

  const renderTabBar = (
    props: SceneRendererProps & {
      navigationState: NavigationState<{
        key: string;
        title: string;
      }>;
    },
  ) => <MyTabBar {...props} scrollY={scrollY} />;

  const { day, hour, minute } = useMemo(() => calculateDayHourMinutes(challenge?.timeToComplete || 0), [challenge?.timeToComplete]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <View style={[styles.backgroundContainer, { height: backgroundHeight + insets.top }]}>
        <Animated.View style={[styles.imageAndCover, { transform: [{ translateY: backgroundTranslateY }], bottom: backgroundBottom }]}>
          {!!backgroundImageUri && (
            <MyImage
              uri={backgroundImageUri}
              defaultSource={DefaultBackgroundPicture}
              params={backgroundImageParams}
              style={backgroundImageUri ? styles.backgroundImage : styles.defaultImage}
            />
          )}
          <View style={styles.imageCover} />
        </Animated.View>
      </View>
      <TabView
        navigationState={{ index: tab, routes }}
        onIndexChange={setTab}
        renderScene={Scene}
        renderTabBar={renderTabBar}
        initialLayout={{ width: screen.width, height: 0 }}
        style={{ width: '100%' }}
      />
      <Animated.View style={[styles.topContainer, { transform: [{ translateY: headerTranslateY }] }]}>
        <View style={[styles.challengeTop, { height: backgroundHeight + insets.top, paddingTop: insets.top + headerHeight, paddingBottom: 54 }]}>
          <View style={styles.challengeRow}>
            <MyImage
              uri={challenge?.imageUri}
              defaultSource={DefaultChallengePictureTyped}
              params={challengeImageParams}
              style={styles.challengeImage}
              imageFormat="png"
            />
            <View style={styles.challengeTitle}>
              <MyText style={styles.titleText}>{challenge?.name}</MyText>
              <MyText style={styles.subtitleText} numberOfLines={1}>
                {challenge?.awardedUsers?.length && projectCount
                  ? `${t(isRootEnv ? 'VIVINAUT' : 'Creator', { count: challenge.awardedUsers.length })}  |  ${t('project', { count: projectCount })}`
                  : ''}
                {challenge?.awardedUsers?.length && !projectCount ? `${t(isRootEnv ? 'VIVINAUT' : 'Creator', { count: challenge.awardedUsers.length })}` : ''}
                {!challenge?.awardedUsers?.length && projectCount ? `${t('project', { count: projectCount })}` : ''}
              </MyText>
            </View>
          </View>
          <MyText style={styles.creatorText}>{`${t('Created By')}: ${challenge?.createdByUser?.name || '-'}`}</MyText>
          <View
            style={[
              styles.topTab,
              styles.tagScroll,
              {
                backgroundColor: Colors[colorScheme].contentBackground,
                borderBottomColor: ChallengeScreenColours[colorScheme].secondaryBackground,
                alignSelf: 'center',
              },
            ]}
          >
            <ScrollView horizontal contentContainerStyle={{ paddingVertical: 5, paddingLeft: 5 }} showsHorizontalScrollIndicator={false}>
              {challenge?.difficulty && (
                <View style={[styles.topTabInfo, { backgroundColor: ChallengeScreenColours[colorScheme].tagBackground }]}>
                  <View style={{ flexDirection: 'row', marginRight: 8 }}>
                    {!!challenge?.difficulty &&
                      difficultyLevels[challenge.difficulty].stars.map((star, index) => <Image key={`star-${index}`} style={[styles.logo]} source={star} />)}
                  </View>
                  <MyText style={styles.descriptionText}>{difficultyLevels[challenge?.difficulty].label}</MyText>
                </View>
              )}
              {challenge?.timeToComplete && (
                <View style={[styles.topTabInfo, { backgroundColor: ChallengeScreenColours[colorScheme].tagBackground }]}>
                  <Image style={[styles.logo, { marginRight: 8 }]} source={Clock} />
                  <MyText style={styles.descriptionText}>
                    {!!day && t('day', { count: day })}
                    {!!hour && t('hour', { count: hour })}
                    {!!minute && t('minute', { count: minute })}
                  </MyText>
                </View>
              )}
              {challenge?.categories && challenge?.categories.length > 0 && (
                <>
                  <View
                    style={[styles.topTabInfo, { backgroundColor: ChallengeScreenColours[colorScheme].tagBackground }]}
                    key={challenge?.categories[0]?.name}
                  >
                    <Image style={[styles.logo, { marginRight: 8 }]} source={Categories} />
                    <MyText style={styles.descriptionText}>{challenge?.categories[0]?.name}</MyText>
                  </View>
                  {!challenge?.timeToComplete &&
                    !challenge?.difficulty &&
                    challenge?.categories?.slice(1).map((v) => (
                      <View
                        style={[styles.topTabInfo, { backgroundColor: ChallengeScreenColours[colorScheme].tagBackground, marginHorizontal: 2 }]}
                        key={`challenge-tag_${v.id}`}
                      >
                        <MyText style={styles.descriptionText}>{v.name}</MyText>
                      </View>
                    ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Animated.View>
      <ChallengeHeader challenge={challenge} onBackPressed={onBackPressed} animatedOffset={scrollY} />
      {isChallengeLoading && <View style={[styles.hideAll, { backgroundColor: Colors[colorScheme].background }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  imageAndCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  defaultImage: {
    flex: 1,
    alignSelf: 'center',
  },
  imageCover: {
    position: 'absolute',
    backgroundColor: '#000',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  topContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
  },
  challengeTop: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  challengeImage: {
    width: 88,
    height: 66,
    borderRadius: 12,
  },
  challengeTitle: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 72,
  },
  titleText: {
    fontSize: 23,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  titleDescription: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 10,
    textAlign: 'center',
  },
  subtitleText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#fff',
    marginHorizontal: 12,
    fontWeight: '400',
  },
  logo: {
    width: 15,
    height: 15,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorText: {
    fontWeight: '400',
    fontSize: 14,
    color: '#fff',
  },
  descriptionText: {
    fontWeight: '400',
    fontSize: 13,
    textAlign: 'center',
  },
  topTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
  },
  tagScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 10,
  },
  topTabInfo: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 12,
  },
  hideAll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
