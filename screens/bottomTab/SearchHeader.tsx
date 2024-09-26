import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import ProjectCategoryApi from 'rn-viviboom/apis/viviboom/ProjectCategoryApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootTabParamList } from 'rn-viviboom/navigation/types';
import NotificationReduxActions from 'rn-viviboom/redux/notification/NotificationReduxActions';

import { ChatContext } from '../stack/chat/context/ChatContext';

const DEFAULT_PROFILE_IMAGE_SIZE = 256;
const HEADER_HEIGHT = 50;

interface SearchHeaderProps {
  navigation: BottomTabNavigationProp<RootTabParamList, 'ProjectListTabScreen' | 'BadgeTabScreen', undefined>;
  hideAnim: SharedValue<number>;
}

export default function SearchHeader({ navigation, hideAnim }: SearchHeaderProps) {
  const notificationsAll = useReduxStateSelector((state) => state?.notification?.all);
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((s) => s.account);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const hideStyle = useAnimatedStyle(() => ({
    opacity: hideAnim?.value ?? 1,
    height: (hideAnim?.value ?? 1) * HEADER_HEIGHT,
  }));

  const [placeholder, setPlaceholder] = useState('');

  const fetchSearchPlaceholder = useCallback(async () => {
    try {
      if (Math.random() > 0.67) {
        // use project category
        const res = await ProjectCategoryApi.getList({ authToken: user?.authToken, limit: 1, offset: Math.floor(Math.random() * 100) });
        setPlaceholder(res?.data?.projectCategories?.[0]?.name);
      } else if (Math.random() < 0.33) {
        // use badge
        const res = await BadgeApi.getList({ authToken: user?.authToken, order: BadgeOrderType.RANDOM, limit: 1, offset: 0 });
        setPlaceholder(res?.data?.badges?.[0]?.name);
      } else {
        // use challenge
        const res = await ChallengeApi.getList({ authToken: user?.authToken, order: BadgeOrderType.RANDOM, limit: 1, offset: 0 });
        setPlaceholder(res?.data?.challenges?.[0]?.name);
      }
    } catch (err) {
      console.log(err);
    }
  }, [user]);

  const unseenNotificationCount = useMemo(() => {
    let count = 0;
    notificationsAll?.forEach((elem) => !elem.seen && count++);
    return Math.min(count, 99);
  }, [notificationsAll]);

  useEffect(() => {
    if (isFocused) {
      fetchSearchPlaceholder();
      NotificationReduxActions.fetch();
    }
  }, [isFocused, fetchSearchPlaceholder]);

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: Colors[colorScheme].background }}>
      <Animated.View style={[styles.container, hideStyle]}>
        <Pressable style={styles.avatarContainer} onPress={() => navigation.navigate('ProfileTabScreen')}>
          <MyImage style={styles.avatar} uri={user.profileImageUri} defaultSource={DefaultProfilePicture} params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }} />
        </Pressable>
        <View style={styles.searchContainer}>
          <Pressable
            style={[styles.searchBox, { backgroundColor: Colors[colorScheme].secondaryBackground }]}
            onPress={() => navigation.navigate('SearchScreen', { placeholder })}
          >
            <Ionicons name="ios-search-outline" size={15} color="#666" />
            <MyText
              style={{ color: Colors[colorScheme].textSecondary, fontWeight: '400', fontSize: 14, marginLeft: 4, marginTop: Platform.OS === 'ios' ? 2 : 0 }}
              numberOfLines={1}
            >
              {placeholder || 'Search'}
            </MyText>
          </Pressable>
        </View>
        <ChatContext.Consumer>
          {({ chatClient, unreadCount }) => (
            !chatClient ? (
              <View style={styles.noChatIcons}>
                <TouchableOpacity style={styles.icon} onPress={() => navigation.navigate('NotificationListScreen')}>
                  <Ionicons name="ios-notifications-outline" size={23} color={Colors[colorScheme].text} />
                  {unseenNotificationCount > 0 && (
                    <View style={[styles.notificationCount, { backgroundColor: Colors[colorScheme].error }]}>
                      <MyText style={styles.notificationCountText}>{unseenNotificationCount}</MyText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.icons}>
                <TouchableOpacity style={styles.icon} onPress={() => navigation.navigate('Chat')} disabled={!chatClient}>
                  <Ionicons name="ios-chatbubble-outline" size={22} color={!chatClient ? Colors[colorScheme].textSecondary : Colors[colorScheme].text} />
                  {unreadCount > 0 && (
                    <View style={[styles.notificationCount, { backgroundColor: Colors[colorScheme].error }]}>
                      <MyText style={styles.notificationCountText}>{Math.min(unreadCount || 0, 99)}</MyText>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.icon} onPress={() => navigation.navigate('NotificationListScreen')}>
                  <Ionicons name="ios-notifications-outline" size={23} color={Colors[colorScheme].text} />
                  {unseenNotificationCount > 0 && (
                    <View style={[styles.notificationCount, { backgroundColor: Colors[colorScheme].error }]}>
                      <MyText style={styles.notificationCountText}>{unseenNotificationCount}</MyText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )
          )}
        </ChatContext.Consumer>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: HEADER_HEIGHT,
  },
  avatarContainer: {
    minWidth: 50,
    maxWidth: 80,
    width: '10%',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 10,
  },
  searchContainer: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  searchBox: {
    flex: 1,
    height: 30,
    borderRadius: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  icons: {
    width: '10%',
    maxWidth: 130,
    minWidth: 80,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  icon: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  noChatIcons: {
    height: 24,
    justifyContent: 'center',
    marginHorizontal: 15,
  },
  notificationCount: {
    position: 'absolute',
    top: -6,
    left: 12,
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
