import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DateTime } from 'luxon';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
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

const DEFAULT_EVENT_ITEM_IMAGE_WIDTH = 128;

interface IProps {
  id?: number;
  preloadedData: MyEvent;
}

const EventCalendarItem = memo(({ id, preloadedData }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [event, setEvent] = useState<MyEvent>(preloadedData);
  const [userBooking, setUserBooking] = useState<UserEventBooking>();

  // API calls
  const fetchEvent = useCallback(async () => {
    if (event || !id) {
      return;
    }
    setLoading(true);
    try {
      const res = await EventApi.get({
        authToken: account?.authToken,
        eventId: id,
      });
      setEvent(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [event, id, account?.authToken]);

  const fetchBooking = useCallback(async () => {
    if (!event) return;
    setLoading(true);
    try {
      const res = await BookingApi.getList({
        authToken: account?.authToken,
        userId: account?.id,
        eventId: event?.id,
      });
      if (res.data.bookings.length > 0) setUserBooking(res.data.bookings[0]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [account?.authToken, account?.id, event]);

  useEffect(() => {
    const init = async () => {
      if (preloadedData) setEvent(preloadedData);
      await fetchEvent();
      await fetchBooking();
    };
    init();
  }, [preloadedData, fetchEvent, fetchBooking]);

  const timeString = useMemo(() => {
    let res = '-';
    try {
      const startTime = DateTime.fromJSDate(new Date(event?.startAt));
      const endTime = startTime.plus({ hour: event.duration });
      res = `${startTime.toLocaleString(DateTime.TIME_SIMPLE)}  -  ${endTime.toLocaleString(DateTime.TIME_SIMPLE)}`;
    } catch (err) {
      console.warn(err);
    }
    return res;
  }, [event.duration, event?.startAt]);

  const isBooked = useMemo(() => userBooking?.status === BookingStatusType.APPROVED, [userBooking]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: isBooked ? Colors[colorScheme].tint : Colors[colorScheme].contentBackground }]}
      onPress={() => navigation.navigate('EventScreen', { preloadedData })}
      activeOpacity={1}
    >
      <View style={styles.statusContainer}>
        <View style={styles.statusTop}>
          <MyText style={{ ...styles.dateText, color: isBooked ? Colors[colorScheme].textInverse : Colors[colorScheme].tint }}>{timeString}</MyText>
          {event?.type === EventType.WORKSHOP ? (
            <MyText style={{ ...styles.titleText, color: isBooked ? Colors[colorScheme].textInverse : Colors[colorScheme].text }} numberOfLines={2}>
              {event?.title}
            </MyText>
          ) : (
            <MyText style={{ ...styles.titleText, color: isBooked ? Colors[colorScheme].textInverse : Colors[colorScheme].text }} numberOfLines={2}>
              {event?.title || t('Free Flow Session')}
            </MyText>
          )}
        </View>
        <View style={styles.statusBottom}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isBooked ? (
              <MyText style={{ color: Colors[colorScheme].textInverse, marginLeft: 4, fontWeight: '600' }}>{isBooked ? '✓  Confirmed' : ''}</MyText>
            ) : (
              <>
                <Ionicons
                  name={event?.type === EventType.WORKSHOP ? 'ios-construct-outline' : 'ios-cafe-outline'}
                  size={15}
                  color={Colors[colorScheme].textSecondary}
                />
                <MyText style={{ color: Colors[colorScheme].textSecondary, fontWeight: '400', marginLeft: 4 }}>
                  {t(event?.type === EventType.WORKSHOP ? 'Workshop' : `${event.branchId === 1 ? 'Tinker Time' : 'Free Flow'}`)}
                </MyText>
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles.imageContainer}>
        <MyImage
          style={styles.image}
          uri={event?.imageUri}
          params={{ width: DEFAULT_EVENT_ITEM_IMAGE_WIDTH }}
          defaultSource={event?.type === EventType.WORKSHOP ? DefaultWorkshopPictureTyped : DefaultFreeFlowPictureTyped}
        />
      </View>
      {!!event && event.bookingCount >= event.maxSlots && (
        <View style={styles.bookingStatus}>
          <MyText style={{ color: '#333', fontSize: 12 }}>{t('Fully Booked')}</MyText>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default EventCalendarItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 24,
    margin: 12,
    borderRadius: 12,
  },
  imageContainer: {
    marginLeft: 12,
  },
  image: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statusTop: {},
  dateText: {
    fontSize: 16,
    fontWeight: '400',
  },
  titleText: {
    fontSize: 16,
    marginTop: 8,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#aaa',
    width: '100%',
    fontWeight: '400',
  },
  statusBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#f2f2f2',
  },
});
