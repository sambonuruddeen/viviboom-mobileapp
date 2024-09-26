import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import Colors from 'rn-viviboom/constants/Colors';
import { BookingStatusType } from 'rn-viviboom/enums/BookingStatusType';
import { EventType } from 'rn-viviboom/enums/EventType';
import EventGridItem from 'rn-viviboom/hoc/EventGridItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const screen = Dimensions.get('screen');
const padding = 18;

const DEFAULT_MY_BOOKING_LIMIT = 4;

interface EventTopBannerProps {
  branch: Branch;
  eventCount: number;
  setEventTopHeight: (height: number) => void;
  openBranchBottomSheet: () => void;
}

export default function EventTopBanner({ branch, eventCount, setEventTopHeight, openBranchBottomSheet }: EventTopBannerProps) {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const account = useReduxStateSelector((s) => s.account);
  const isRootEnv = account.institutionId === 1;
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // user bookings
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);
  const [bookings, setBookings] = useState<UserEventBooking[]>([]);

  const fetchBookings = useCallback(async () => {
    setIsFetchingBookings(true);

    const requestParams = {
      authToken: account?.authToken,
      userId: account?.id,
      startDate: new Date().toISOString(),
      // status: BookingStatusType.APPROVED,
      limit: DEFAULT_MY_BOOKING_LIMIT,
      offset: 0,
    };

    try {
      const res = await BookingApi.getList(requestParams);
      setBookings(res.data.bookings);
    } catch (err) {
      console.error(err);
    }
    setIsFetchingBookings(false);
  }, [account?.authToken, account?.id]);

  useEffect(() => {
    if (isFocused) fetchBookings();
  }, [fetchBookings, isFocused]);

  const status2Color = useMemo(
    () => ({
      [BookingStatusType.SUBMITTED]: Colors[colorScheme].contentBackground,
      [BookingStatusType.APPROVED]: Colors[colorScheme].success,
      [BookingStatusType.CANCELLED]: Colors[colorScheme].warning,
      [BookingStatusType.REJECTED]: Colors[colorScheme].error,
    }),
    [colorScheme],
  );

  const status2Description = useMemo(
    () => ({
      [BookingStatusType.SUBMITTED]: t('Pending'),
      [BookingStatusType.APPROVED]: t('Confirmed'),
      [BookingStatusType.CANCELLED]: t('Cancelled'),
      [BookingStatusType.REJECTED]: t('Unsuccessful'),
    }),
    [t],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 50 }]}>
      <View style={[styles.myBookings, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <View style={styles.bookingRow}>
          <MyText style={styles.title}>{t('My Bookings')}</MyText>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => navigation.navigate('MyBookingScreen')}>
            <MyText style={styles.showMore}>{t('Show All')}</MyText>
            <Ionicons name="ios-chevron-forward-outline" size={14} color="#aaa" />
          </TouchableOpacity>
        </View>
        {bookings.length ? (
          <View style={styles.myBookingGrid}>
            {bookings.map((v) => (
              <View key={`my-booking_${v.id}`} style={styles.myBookingItem}>
                <EventGridItem preloadedData={v.event} />
                <View style={[styles.bookingStatus, { backgroundColor: status2Color[v.status] }]}>
                  <MyText style={{ color: v.status !== BookingStatusType.SUBMITTED ? '#fff' : Colors[colorScheme].textSecondary, fontSize: 12 }}>
                    {status2Description[v.status]}
                  </MyText>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noBooking}>
            <MyText style={styles.noBookingText}>{t('You do not have any upcoming sessions. Book a slot from below!')}</MyText>
          </View>
        )}
      </View>
      <View style={[styles.listHeader, { backgroundColor: Colors[colorScheme].contentBackground }]} onLayout={(e) => setEventTopHeight(e.nativeEvent.layout.y)}>
        <View style={styles.selectBranch}>
          <View style={styles.branchRow}>
            <MyText style={styles.branchTitle}>{isRootEnv ? 'VIVITA events in' : 'Recent events in'}</MyText>
            <TouchableOpacity style={styles.branchRow} onPress={openBranchBottomSheet}>
              <Ionicons name="ios-location" size={16} style={{ marginHorizontal: 8, color: Colors[colorScheme].tint }} />
              <MyText style={{ ...styles.branchText, color: Colors[colorScheme].tint }}>{branch?.name || 'All Branches'}</MyText>
              <Ionicons name="ios-chevron-down" size={16} style={{ marginHorizontal: 4, color: Colors[colorScheme].tint }} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.categories}>
          <TouchableOpacity
            style={styles.categoryItem}
            activeOpacity={1}
            onPress={() => navigation.navigate('EventListScreen', { type: EventType.WORKSHOP, branchId: branch?.id })}
          >
            <Ionicons name="ios-construct-outline" size={28} color={Colors[colorScheme].textSecondary} />
            <MyText style={styles.categoryText}>{t('Workshops')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryItem}
            activeOpacity={1}
            onPress={() => navigation.navigate('EventListScreen', { type: EventType.FREE_FLOW, branchId: branch?.id })}
          >
            <Ionicons name="ios-cafe-outline" size={28} color={Colors[colorScheme].textSecondary} />
            <MyText style={styles.categoryText}>{t(branch?.id === 1 ? 'Tinker Time' : 'Free Flow')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem} activeOpacity={1} onPress={() => navigation.navigate('EventCalendarScreen', { branch })}>
            <Ionicons name="ios-calendar-outline" size={28} color={Colors[colorScheme].textSecondary} />
            <MyText style={styles.categoryText}>{t('Calendar')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem} activeOpacity={1} onPress={() => navigation.navigate('MyBookingScreen')}>
            <Ionicons name="ios-book-outline" size={28} color={Colors[colorScheme].textSecondary} />
            <MyText style={styles.categoryText}>{t('My Bookings')}</MyText>
          </TouchableOpacity>
        </View>
        <View style={styles.listTitle}>
          <MyText>{eventCount ? t('booking.Event', { count: eventCount }) : ''}</MyText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screen.width,
  },
  myBookings: {
    width: screen.width - 2 * padding,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding,
    margin: padding,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  showMore: {
    fontWeight: '400',
    fontSize: 12,
    color: '#aaa',
    paddingTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  noBooking: {
    width: '100%',
    justifyContent: 'center',
    padding: 30,
  },
  noBookingText: {
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 18,
  },
  myBookingGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  myBookingItem: {
    width: (screen.width - 5 * padding) / 2,
    marginTop: 18,
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
    backgroundColor: '#fff',
  },
  selectBranch: {
    paddingVertical: 12,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchTitle: {
    fontSize: 18,
  },
  branchText: {
    fontSize: 16,
  },
  flagEmoji: {
    fontSize: 16,
    marginHorizontal: 8,
    position: 'relative',
    top: -8,
  },
  listHeader: {
    width: '100%',
    paddingHorizontal: padding,
    paddingTop: padding,
    marginTop: 12,
  },
  categories: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 18,
  },
  categoryItem: {
    alignItems: 'center',
    width: 84,
  },
  categoryText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  listTitle: {
    marginVertical: 8,
  },
});
