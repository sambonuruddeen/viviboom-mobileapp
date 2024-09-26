import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DateTime } from 'luxon';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import DefaultFreeFlowPicture from 'rn-viviboom/assets/images/default-freeflow.png';
import DefaultWorkshopPicture from 'rn-viviboom/assets/images/default-workshop.png';
import Colors from 'rn-viviboom/constants/Colors';
import { BookingStatusType } from 'rn-viviboom/enums/BookingStatusType';
import { EventType } from 'rn-viviboom/enums/EventType';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyImage from './MyImage';
import MyText from './MyText';

const DefaultFreeFlowPictureTyped = DefaultFreeFlowPicture as ImageRequireSource;
const DefaultWorkshopPictureTyped = DefaultWorkshopPicture as ImageRequireSource;

const DEFAULT_EVENT_ITEM_IMAGE_WIDTH = 256;

interface IProps {
  id?: number;
  preloadedData: UserEventBooking;
}

const BookingListItem = memo(({ id, preloadedData }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [booking, setBooking] = useState<UserEventBooking>(preloadedData);

  // API calls
  const fetchBooking = useCallback(async () => {
    if (booking?.event || !id) {
      return;
    }
    setLoading(true);
    try {
      const res = await BookingApi.get({
        authToken: account?.authToken,
        bookingId: id,
      });
      setBooking(res.data?.booking);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [booking, id, account?.authToken]);

  useEffect(() => {
    setBooking(preloadedData);
    fetchBooking();
  }, [fetchBooking, preloadedData]);

  const dateString = useMemo(() => {
    let res = '-';
    try {
      res = DateTime.fromJSDate(new Date(booking?.event?.startAt)).toLocaleString(DateTime.DATETIME_MED);
    } catch (err) {
      console.warn(err);
    }
    return res;
  }, [booking?.event?.startAt]);

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
    <TouchableOpacity
      style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}
      onPress={() => navigation.push('EventScreen', { preloadedData: booking?.event })}
      activeOpacity={1}
    >
      <View style={styles.statusContainer}>
        <View style={styles.statusTop}>
          <MyText style={styles.titleText} numberOfLines={2}>
            {booking?.event?.title}
          </MyText>
          <MyText style={styles.dateText}>{dateString}</MyText>
        </View>
        <View style={styles.statusBottom}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={booking?.event?.type === EventType.WORKSHOP ? 'ios-construct-outline' : 'ios-cafe-outline'}
              size={15}
              color={Colors[colorScheme].textSecondary}
            />
            <MyText style={{ color: Colors[colorScheme].textSecondary, fontWeight: '400', marginLeft: 4 }}>
              {t(booking?.event?.type === EventType.WORKSHOP ? 'Workshop' : `${booking?.event?.branchId === 1 ? 'Tinker Time' : 'Free Flow'}`)}
            </MyText>
          </View>
        </View>
      </View>
      <View style={styles.imageContainer}>
        <MyImage
          style={styles.image}
          uri={booking?.event?.imageUri}
          params={{ width: DEFAULT_EVENT_ITEM_IMAGE_WIDTH }}
          defaultSource={booking?.event?.type === EventType.WORKSHOP ? DefaultWorkshopPictureTyped : DefaultFreeFlowPictureTyped}
        />
        {!!booking?.status && (
          <View style={[styles.bookingStatus, { backgroundColor: status2Color[booking?.status] }]}>
            <MyText style={{ color: booking?.status !== BookingStatusType.SUBMITTED ? '#fff' : Colors[colorScheme].textSecondary, fontSize: 12 }}>
              {status2Description[booking?.status]}
            </MyText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default BookingListItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    margin: 18,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 9,
  },
  imageContainer: {
    width: '45%',
    alignItems: 'flex-end',
  },
  image: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    height: 120,
    width: '100%',
    maxWidth: 160,
  },
  statusContainer: {
    flex: 1,
    margin: 18,
    justifyContent: 'space-between',
  },
  statusTop: {},
  dateText: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 6,
  },
  titleText: {
    fontSize: 16,
    lineHeight: 18,
  },
  statusBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
