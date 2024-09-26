/* eslint-disable no-underscore-dangle */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import Colors from 'rn-viviboom/constants/Colors';
import NotificationTypeEnum from 'rn-viviboom/enums/NotificationType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import NotificationReduxActions from 'rn-viviboom/redux/notification/NotificationReduxActions';

import NotificationItem from './NotificationItem';

const notificationFilters: Record<string, string[]> = {
  Comments: [NotificationTypeEnum.PROJECT_COMMENT, NotificationTypeEnum.COMMENT_REPLY],
  Likes: [NotificationTypeEnum.PROJECT_LIKE, NotificationTypeEnum.COMMENT_LIKE],
  Badges: [
    NotificationTypeEnum.BADGE_AWARD,
    NotificationTypeEnum.BADGE_REMOVAL,
    NotificationTypeEnum.PROJECT_BADGE_APPROVAL,
    NotificationTypeEnum.PROJECT_BADGE_REJECTION,
  ],
  System: [
    NotificationTypeEnum.MESSAGE,
    NotificationTypeEnum.STARTER_CRITERIA,
    NotificationTypeEnum.WALLET_ACTIVATION,
    NotificationTypeEnum.TRANSACTION_RECEIVE,
  ],
};

const filters = ['Comments', 'Likes', 'Badges', 'System'];

export default function NotificationListScreen({ navigation, route }: RootStackScreenProps<'NotificationListScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'notifications' });
  const colorScheme = useColorScheme();
  // for all notification page
  const notificationsAll = useReduxStateSelector((state) => state.notification.all);
  const [isLoading, setLoading] = useState(false);

  const notifications = notificationsAll.filter((notif) => !route.params?.filter || notificationFilters[route.params?.filter].includes(notif?.type));

  const unseenNotificationCount = useMemo(() => {
    const count = { Comments: 0, Likes: 0, Badges: 0, CoSystemmments: 0 };
    if (route.params?.filter) return count;
    filters.forEach((filter) => {
      count[filter] = Math.min(notificationsAll.filter((notif) => !notif.seen && notificationFilters[filter].includes(notif?.type)).length, 99);
    });
    return count;
  }, [notificationsAll, route.params?.filter]);

  const filterData: Record<string, Record<string, string>> = useMemo(
    () => ({
      Comments: { color: Colors[colorScheme].success, icon: 'ios-chatbubble-ellipses' },
      Likes: { color: 'rgb(248,48,95)', icon: 'ios-heart' },
      Badges: { color: Colors[colorScheme].warning, icon: 'ios-ribbon' },
      System: { color: Colors[colorScheme].tint, icon: 'ios-megaphone' },
    }),
    [colorScheme],
  );

  const onRefresh = async (hardRefresh = false) => {
    setLoading(true);
    // if its individual notif type screen, stop the refresh unless hard refresh
    if (!route.params?.filter || hardRefresh) {
      await NotificationReduxActions.fetch();
    }
    setLoading(false);
  };

  useEffect(() => {
    navigation.setOptions({
      title: route.params?.filter || 'Messages',
      headerTintColor: Colors[colorScheme].text,
      headerBackTitle: '',
      headerStyle: { backgroundColor: Colors[colorScheme].secondaryBackground },
      headerShadowVisible: false,
    });

    const notificationIds = (notifications || []).filter((notif) => !notif.seen && !notif.present).map((notif) => notif.id);
    if (notificationIds.length > 0) NotificationReduxActions.markSeen({ notificationIds });
  }, [colorScheme, navigation, notifications, route.params?.filter]);

  useEffect(() => {
    onRefresh();
  }, []);

  const flatListHeaderComponent = () => (
    <View style={[styles.categories, { backgroundColor: Colors[colorScheme].contentBackground, shadowOpacity: 0 }]}>
      {filters.map((filter) => (
        <TouchableOpacity key={filter} style={styles.categoryItem} activeOpacity={1} onPress={() => navigation.push('NotificationListScreen', { filter })}>
          <Ionicons name={filterData[filter].icon} size={26} color={filterData[filter].color} />
          {unseenNotificationCount.Comments > 0 && (
            <View style={[styles.notificationCount, { backgroundColor: Colors[colorScheme].error }]}>
              <MyText style={styles.notificationCountText}>{unseenNotificationCount[filter]}</MyText>
            </View>
          )}
          <MyText style={styles.categoryText}>{t(filter)}</MyText>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <FlatList
      ListHeaderComponent={!route.params?.filter ? flatListHeaderComponent : null}
      style={[styles.container, { backgroundColor: Colors[colorScheme].secondaryBackground }]}
      data={notifications}
      renderItem={({ item }) => <NotificationItem notification={item} navigation={navigation} />}
      ListEmptyComponent={<MyText style={styles.noItemFoundText}>{t('There are no notifications!')}</MyText>}
      onRefresh={() => onRefresh(true)}
      refreshing={isLoading}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noItemFoundText: {
    textAlign: 'center',
    marginTop: 40,
  },
  textInput: {
    height: 40,
    width: null,
  },
  listItem: {
    marginVertical: 4,
  },
  categories: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  categoryItem: {
    alignItems: 'center',
    width: 84,
  },
  categoryText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  notificationCount: {
    position: 'absolute',
    top: -6,
    right: 12,
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
