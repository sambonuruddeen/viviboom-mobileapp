import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

import Colors from 'rn-viviboom/constants/Colors';
import { UserStatusType } from 'rn-viviboom/enums/UserStatusType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList, RootTabScreenProps } from 'rn-viviboom/navigation/types';

import BadgeListTab from './badges/BadgeListTab';
import BadgeRandomizerTab from './badges/BadgeRandomizerTab';
import StarterCriteriaTab from './badges/StarterCriteriaTab';

const screen = Dimensions.get('screen');

type SceneProps = SceneRendererProps & {
  route: {
    key: string;
    title: string;
  };
};

const tabWidth = Platform.OS === 'ios' ? 84 : 96;

const MyTabBar = (props) => {
  const notificationsAll = useReduxStateSelector((state) => state?.notification?.all);
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const unseenNotificationCount = useMemo(() => {
    let count = 0;
    notificationsAll?.forEach((elem) => !elem.seen && count++);
    return Math.min(count, 99);
  }, [notificationsAll]);

  return (
    <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
      <TouchableOpacity style={styles.icon} onPress={() => navigation.navigate('NotificationListScreen')}>
        <Ionicons name="ios-notifications-outline" size={23} color={Colors[colorScheme].text} />
        {unseenNotificationCount > 0 && (
          <View style={[styles.notificationCount, { backgroundColor: Colors[colorScheme].error }]}>
            <MyText style={styles.notificationCountText}>{unseenNotificationCount}</MyText>
          </View>
        )}
      </TouchableOpacity>
      <TabBar
        {...props}
        scrollEnabled
        indicatorStyle={{ backgroundColor: Colors[colorScheme].tint, width: 30, left: (tabWidth - 30) / 2, top: 40 }}
        style={[styles.tabBarContainer, { backgroundColor: Colors[colorScheme].background }]}
        tabStyle={{ width: tabWidth }}
        renderLabel={({ route, focused }) => (
          <MyText style={{ color: focused ? Colors[colorScheme].text : Colors[colorScheme].textInactive, fontWeight: '400' }}>{route.title}</MyText>
        )}
      />
      <TouchableOpacity style={styles.icon} onPress={() => navigation.navigate('SearchScreen')}>
        <Ionicons name="ios-search-outline" size={23} color={Colors[colorScheme].text} />
      </TouchableOpacity>
    </View>
  );
};

export default function BadgeTabScreen({ navigation }: RootTabScreenProps<'BadgeTabScreen'>) {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((s) => s.account);
  const insets = useSafeAreaInsets();

  const isShowStarterCriteriaTab =
    (user.branch?.starterBadgeRequirementCount > 0 || user.branch?.starterChallengeRequirementCount > 0 || user.branch?.starterAttendanceRequirementCount > 0) &&
    user.status === UserStatusType.EXPLORER &&
    user.institutionId === 1;

  const [tab, setTab] = useState(isShowStarterCriteriaTab ? 0 : 1); // tab index

  let routes = [
    { key: 'Randomizer', title: 'Explore' },
    { key: 'Challenges', title: 'Challenges' },
    { key: 'Badges', title: 'Badges' },
  ];

  if (isShowStarterCriteriaTab) {
    routes = [
      { key: 'StarterCriteria', title: 'Explore' },
      { key: 'Challenges', title: 'Challenges' },
      { key: 'Badges', title: 'Badges' },
    ];
  }

  const Scene = ({ route }: SceneProps) => {
    switch (route.key) {
      // to add more routes. e.g. home pagecase 'StarterCriteria':
      case 'StarterCriteria':
        return <StarterCriteriaTab isShowing={isFocused && tab === (user.status === UserStatusType.EXPLORER ? 0 : 2)} />;
      case 'Randomizer':
        return <BadgeRandomizerTab />;
      case 'Challenges':
        return <BadgeListTab isChallenge={true} />;
      default:
        return <BadgeListTab />;
    }
  };

  return (
    <View style={{ ...styles.container, paddingTop: insets.top, backgroundColor: Colors[colorScheme].background }}>
      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{ index: tab, routes }}
          onIndexChange={setTab}
          renderScene={Scene}
          renderTabBar={MyTabBar}
          initialLayout={{ width: screen.width, height: 0 }}
          lazy
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: screen.width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 50,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabViewContainer: {
    flex: 1,
    width: '100%',
  },
  tabBarContainer: {
    height: 48,
    alignItems: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  icon: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    position: 'absolute',
    top: -5,
    left: 10,
    borderRadius: 7,
    paddingHorizontal: 4,
    paddingVertical: Platform.OS === 'ios' ? 2 : 0,
  },
  notificationCountText: {
    color: '#fff',
    fontSize: 11,
    position: 'relative',
    top: Platform.OS === 'ios' ? 0.5 : -0.7,
  },
});
