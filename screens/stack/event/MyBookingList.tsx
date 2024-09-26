import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import BookingListItem from 'rn-viviboom/hoc/BookingListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import EventReduxAction from 'rn-viviboom/redux/event/EventReduxActions';

const DEFAULT_BOOKING_REQUEST_COUNT = 20;

const MyBookingList = ({ type }: { type: string }) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const isFocused = useIsFocused();
  const account = useReduxStateSelector((s) => s.account);
  const offlineData = useReduxStateSelector((s) => s.event?.myBookings);

  const [bookingCount, setBookingCount] = useState(0);
  const [bookings, setBookings] = useState<Array<UserEventBooking>>([]);
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);
  const [isEndOfBookings, setIsEndOfBookings] = useState(false);

  useEffect(() => {
    const init = () => {
      setBookings(offlineData);
      fetchBookings(true);
    };
    if (isFocused) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const fetchBookings = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingBookings) return;
      if (!hardRefresh && isEndOfBookings) return;
      setIsFetchingBookings(true);

      const requestParams = {
        authToken: account?.authToken,
        userId: account?.id,
        limit: DEFAULT_BOOKING_REQUEST_COUNT,
        offset: hardRefresh ? 0 : bookings.length,
        startDate: undefined,
        endDate: undefined,
      };

      if (type === 'Upcoming') {
        requestParams.startDate = new Date().toISOString();
      } else if (type === 'Past') {
        requestParams.endDate = new Date().toISOString();
      }

      try {
        const res = await BookingApi.getList(requestParams);
        if (hardRefresh) {
          const newBookings = res.data.bookings;
          setBookingCount(res.data.count);
          EventReduxAction.save({ myBookings: newBookings });
          setBookings(newBookings);
        } else {
          setBookings([...bookings, ...res.data.bookings]);
        }

        // check if end of list
        if (res.data.bookings.length < DEFAULT_BOOKING_REQUEST_COUNT) {
          setIsEndOfBookings(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingBookings(false);
    },
    [isFetchingBookings, isEndOfBookings, account?.authToken, account?.id, bookings, type],
  );

  const flatListRenderItem = useCallback(
    ({ item, index }) => (
      <View style={{ backgroundColor: Colors[colorScheme].background, width: Layout.screen.width }}>
        <BookingListItem id={item.id} preloadedData={item} />
      </View>
    ),
    [colorScheme],
  );

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.listTitle}>
          <MyText style={{ fontSize: 16 }}>{bookingCount ? `${bookingCount} ${t('Bookings')}` : ''}</MyText>
        </View>
      }
      ListFooterComponent={
        !isEndOfBookings ? null : (
          <MyText style={styles.noItemFoundText}>{!isFetchingBookings && !bookings.length ? 'No bookings yet' : 'Yay! You have seen it all!'}</MyText>
        )
      }
      data={bookings}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchBookings(false)}
      refreshing={isFetchingBookings}
      onRefresh={() => fetchBookings(true)}
      keyExtractor={(item: UserEventBooking) => `booking_${item.id}`}
    />
  );
};

export default MyBookingList;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  listTitle: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
});
