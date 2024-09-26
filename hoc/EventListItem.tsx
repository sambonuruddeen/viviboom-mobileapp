import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DateTime } from 'luxon';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ImageRequireSource, Platform, Pressable, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
import DefaultFreeFlowPicture from 'rn-viviboom/assets/images/default-freeflow.png';
import DefaultWorkshopPicture from 'rn-viviboom/assets/images/default-workshop.png';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
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
  preloadedData: MyEvent;
}

const EventListItem = memo(({ id, preloadedData }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [event, setEvent] = useState<MyEvent>(preloadedData);

  const onShare = async () => {
    try {
      const message = `Check out the ${event.title} event on VIVIBOOM`;
      const eventUrl = `${Config.MobileAppUrl}/event/${event?.id}`;
      const result = await Share.share({
        message: Platform.OS === 'ios' ? message : eventUrl,
        url: eventUrl,
        title: message,
      });
      if (result.action === Share.sharedAction) {
        Toast.show({ text1: 'Yay! Event shared successfully', type: 'success' });
      }
    } catch (error) {
      Toast.show({ text1: error?.message, type: 'error' });
    }
  };

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

  useEffect(() => {
    if (preloadedData) setEvent(preloadedData);
    fetchEvent();
  }, [preloadedData, fetchEvent]);

  const dateString = useMemo(() => {
    let res = '-';
    try {
      res = DateTime.fromJSDate(new Date(event?.startAt)).toLocaleString(DateTime.DATETIME_MED);
    } catch (err) {
      console.warn(err);
    }
    return res;
  }, [event?.startAt]);

  return (
    <Pressable style={styles.container} onPress={() => navigation.navigate('EventScreen', { preloadedData })}>
      <View style={styles.imageContainer}>
        <MyImage
          style={styles.image}
          uri={event?.imageUri}
          params={{ width: DEFAULT_EVENT_ITEM_IMAGE_WIDTH }}
          defaultSource={event?.type === EventType.WORKSHOP ? DefaultWorkshopPictureTyped : DefaultFreeFlowPictureTyped}
        />
        {!!event && event.bookingCount >= event.maxSlots && (
          <View style={styles.bookingStatus}>
            <MyText style={{ color: '#333', fontSize: 12 }}>{t('Fully Booked')}</MyText>
          </View>
        )}
      </View>
      <View style={styles.statusContainer}>
        <View style={styles.statusTop}>
          <MyText style={{ ...styles.dateText, color: Colors[colorScheme].tint }}>{dateString}</MyText>
          {event?.type === EventType.WORKSHOP ? (
            <MyText style={styles.titleText} numberOfLines={2}>
              {event?.title}
            </MyText>
          ) : (
            <MyText style={styles.titleText} numberOfLines={2}>
              {event?.title || t('Free Flow Session')}
            </MyText>
          )}
          <View style={styles.descriptionContainer}>
            {event?.description ? (
              <MyText style={styles.descriptionText} numberOfLines={2}>
                {event?.description}
              </MyText>
            ) : null}
          </View>
        </View>
        <View style={styles.statusBottom}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={event?.type === EventType.WORKSHOP ? 'ios-construct-outline' : 'ios-cafe-outline'}
              size={15}
              color={Colors[colorScheme].textSecondary}
            />
            <MyText style={{ color: Colors[colorScheme].textSecondary, fontWeight: '400', marginLeft: 4 }}>
              {t(event?.type === EventType.WORKSHOP ? 'Workshop' : `${event.branchId === 1 ? 'Tinker Time' : 'Free Flow'}`)}
            </MyText>
          </View>
          <TouchableOpacity activeOpacity={1} onPress={onShare}>
            <Ionicons name="ios-share-outline" size={16} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
});

export default EventListItem;

const styles = StyleSheet.create({
  container: {
    margin: 0,
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  imageContainer: {},
  image: {
    borderRadius: 4,
    height: 120,
    width: 160,
  },
  statusContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  statusTop: {},
  dateText: {
    fontSize: 15,
  },
  titleText: {
    fontSize: 18,
    marginTop: 4,
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
