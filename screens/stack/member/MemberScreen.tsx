import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, ImageRequireSource, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationState, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import explorerPicture from 'rn-viviboom/assets/images/explorer.png';
import vivinautPicture from 'rn-viviboom/assets/images/vivinaut.png';
import Colors from 'rn-viviboom/constants/Colors';
import { UserStatusType } from 'rn-viviboom/enums/UserStatusType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

import MemberBadgeTab from './MemberBadgeTab';
import MemberChallengeTab from './MemberChallengeTab';
import MemberHeader from './MemberHeader';
import MemberHomeTab from './MemberHomeTab';
import MemberProjectTab from './MemberProjectTab';
import { backgroundHeight, headerHeight, tabBarHeight } from './constants';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const explorerPictureTyped = explorerPicture as ImageRequireSource;
const vivinautPictureTyped = vivinautPicture as ImageRequireSource;

const DEFAULT_PROFILE_IMAGE_SIZE = 256;
const DEFAULT_BACKGROUND_IMAGE_SIZE = 512;

const screen = Dimensions.get('screen');

/* refer to https://medium.com/@linjunghsuan/implementing-a-collapsible-header-with-react-native-tab-view-24f15a685e07 for implementation of collapsible header */

const routes = [
  { key: 'Home', title: 'Home' },
  { key: 'Badges', title: 'Badges' },
  { key: 'Challenges', title: 'Challenges' },
  { key: 'Projects', title: 'Projects' },
];

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
          <MyText style={{ color: focused ? Colors[colorScheme].tint : Colors[colorScheme].textInactive, fontWeight: '400', marginBottom: 10 }}>
            {route.title}
          </MyText>
        )}
      />
    </Animated.View>
  );
};

export default function MemberScreen({ navigation, route }: RootStackScreenProps<'MemberScreen'>) {
  const colorScheme = useColorScheme();

  const preloadedData = route.params?.preloadedData;
  const user = useReduxStateSelector((state) => state.account);
  const isRootEnv = user.institutionId === 1;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [isMemberLoading, setMemberLoading] = useState(true);
  const [member, setMember] = useState(preloadedData);

  const [tab, setTab] = useState(route.params?.tab || 0); // tab index
  const [projectFilterKey, setProjectFilterKey] = useState(route.params?.projectTab || 'Latest');

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
            if (key === 'Home') {
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
              if (key === 'Home') {
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

  const Scene = ({ route: tabRoute, jumpTo }: SceneProps) => {
    switch (tabRoute.key) {
      case 'Home':
        return (
          <MemberHomeTab
            member={member}
            scrollY={scrollY}
            ref={(ref) => {
              listRefs.current[tabRoute.key] = ref;
            }}
            onScrollEnd={syncScrollOffset}
            jumpTo={jumpTo}
          />
        );
      case 'Badges':
        return (
          <MemberBadgeTab
            member={member}
            scrollY={scrollY}
            ref={(ref) => {
              listRefs.current[tabRoute.key] = ref;
            }}
            onScrollEnd={syncScrollOffset}
          />
        );
      case 'Challenges':
        return (
          <MemberChallengeTab
            member={member}
            scrollY={scrollY}
            ref={(ref) => {
              listRefs.current[tabRoute.key] = ref;
            }}
            onScrollEnd={syncScrollOffset}
          />
        );
      case 'Projects':
        return (
          <MemberProjectTab
            member={member}
            scrollY={scrollY}
            filterKey={projectFilterKey}
            setFilterKey={setProjectFilterKey}
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
  const fetchMember = useCallback(async () => {
    setMemberLoading(true);
    try {
      const res = await UserApi.get({
        authToken: user?.authToken,
        userId: preloadedData?.id,
      });
      setMember(res.data?.user);
    } catch (err) {
      console.log(err);
    }
    setMemberLoading(false);
  }, [preloadedData?.id, user?.authToken]);

  const onBackPressed = () => {
    navigation.pop();
  };

  useEffect(() => {
    // scrollRef.current?.scrollTo({ y: 0 });
    fetchMember();
  }, [fetchMember]);

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
    outputRange: [-200, 0],
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

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <View style={[styles.backgroundContainer, { height: backgroundHeight + insets.top }]}>
        <Animated.View style={[styles.imageAndCover, { transform: [{ translateY: backgroundTranslateY }], bottom: backgroundBottom }]}>
          {!!member?.coverImageUri && <MyImage uri={member?.coverImageUri} params={{ width: DEFAULT_BACKGROUND_IMAGE_SIZE }} style={styles.backgroundImage} />}
          <LinearGradient style={styles.imageCover} colors={['rgba(0, 0, 0, 0.3)', 'transparent']} />
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
      <Animated.View style={[styles.topContainer, { height: backgroundHeight + insets.top, transform: [{ translateY: headerTranslateY }] }]}>
        <View style={[styles.memberBottom, { backgroundColor: Colors[colorScheme].contentBackground }]}>
          <View style={styles.memberRow}>
            <View style={styles.memberImageContainer}>
              <MyImage
                uri={member?.profileImageUri}
                defaultSource={DefaultProfilePictureTyped}
                params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                style={styles.memberImage}
              />
              {!!member?.branch?.countryISO && (
                <View style={styles.countryImageContainer}>
                  <MyImage defaultSource={CountryUtil.getCountryFlag(member?.branch?.countryISO)} style={styles.countryImage} />
                </View>
              )}
            </View>
            <View style={styles.memberInfo}>
              <Pressable style={styles.memberStat} onPress={() => setTab(1)}>
                <MyText style={{ fontSize: 17 }}>{member?.badgeCount || 0}</MyText>
                <MyText style={{ marginTop: 4, fontWeight: '400', fontSize: 13, color: Colors[colorScheme].textSecondary }}>Badges</MyText>
              </Pressable>
              <View style={styles.verticalDivider} />
              <Pressable style={styles.memberStat} onPress={() => setTab(2)}>
                <MyText style={{ fontSize: 17 }}>{member?.challengeCount || 0}</MyText>
                <MyText style={{ marginTop: 4, fontWeight: '400', fontSize: 13, color: Colors[colorScheme].textSecondary }}>Challenges</MyText>
              </Pressable>
              <View style={styles.verticalDivider} />
              <Pressable style={styles.memberStat} onPress={() => setTab(3)}>
                <MyText style={{ fontSize: 17 }}>{member?.projectCount || 0}</MyText>
                <MyText style={{ marginTop: 4, fontWeight: '400', fontSize: 13, color: Colors[colorScheme].textSecondary }}>Projects</MyText>
              </Pressable>
            </View>
          </View>
          <View style={styles.nameContainer}>
            <MyText style={styles.nameText}>{member?.name}</MyText>
            {isRootEnv && (
              <TouchableOpacity style={styles.statusContainer} onPress={() => navigation.navigate('StarterCriteriaScreen')}>
                <View style={styles.statusTextContainer}>
                  <MyText style={styles.statusText}>{user.status ?? '-'}</MyText>
                </View>
                <MyImage defaultSource={user.status === UserStatusType.VIVINAUT ? vivinautPictureTyped : explorerPictureTyped} style={styles.statusPicture} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.descriptionContainer}>
            <MyText style={styles.descriptionText}>
              {member?.description || `This mysterious ${isRootEnv ? 'VIVINAUT' : 'creator'} didn't write anything`}
            </MyText>
          </View>
        </View>
      </Animated.View>
      <MemberHeader member={member} onBackPressed={onBackPressed} animatedOffset={scrollY} isRootEnv={isRootEnv} />
      {isMemberLoading && <View style={[styles.hideAll, { backgroundColor: Colors[colorScheme].background }]} />}
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
    bottom: '40%',
  },
  defaultImage: {
    flex: 1,
    alignSelf: 'center',
  },
  imageCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
  },
  memberBottom: {
    width: '100%',
    height: '42%',
    borderBottomColor: 'rgba(160, 160, 160, 0.2)',
    borderBottomWidth: 0.5,
    paddingHorizontal: 12,
    justifyContent: 'space-evenly',
    paddingBottom: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 90,
  },
  memberImageContainer: {
    position: 'relative',
    top: -12,
    marginHorizontal: 12,
  },
  memberImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#fff',
  },
  countryImageContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 1,
    right: 1,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  countryImage: {
    width: 19.5,
    height: 19.5,
    borderRadius: 10,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    marginLeft: 18,
  },
  memberStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  verticalDivider: {
    height: '25%',
    borderColor: '#ddd',
    borderWidth: 0.5,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: Platform.OS === 'ios' ? 'flex-start' : 'center',
    marginBottom: 12,
  },
  nameText: {
    fontWeight: '500',
    fontSize: 20,
  },
  statusPicture: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusTextContainer: {
    marginHorizontal: 4,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  descriptionContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionText: {
    color: '#888',
    fontWeight: '400',
    fontSize: 13,
  },
  tabViewContainer: {
    width: '100%',
    height: 30,
    borderWidth: 2,
  },
  hideAll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
