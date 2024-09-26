import { useNavigation } from '@react-navigation/native';
import { DateTime } from 'luxon';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, ImageRequireSource, Pressable, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
import DefaultFreeFlowPicture from 'rn-viviboom/assets/images/default-freeflow.png';
import DefaultWorkshopPicture from 'rn-viviboom/assets/images/default-workshop.png';
import { EventType } from 'rn-viviboom/enums/EventType';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyImage from './MyImage';
import MyText from './MyText';

const DefaultFreeFlowPictureTyped = DefaultFreeFlowPicture as ImageRequireSource;
const DefaultWorkshopPictureTyped = DefaultWorkshopPicture as ImageRequireSource;

const DEFAULT_EVENT_IMAGE_WIDTH = 256;

const aspectRatio = 3 / 2;

interface IProps {
  id?: number;
  preloadedData: MyEvent;
  style?: StyleProp<ViewStyle>;
}

const EventGridItem = memo(({ id, preloadedData, style }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [event, setEvent] = useState<MyEvent>(preloadedData);

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
      setEvent(res.data?.event);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [event, id, account?.authToken]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

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
    <TouchableOpacity style={[styles.container, style]} onPress={() => navigation.navigate('EventScreen', { preloadedData: event })} activeOpacity={1}>
      <View style={styles.imageContainer}>
        <MyImage
          uri={event?.imageUri}
          defaultSource={event?.type === EventType.WORKSHOP ? DefaultWorkshopPictureTyped : DefaultFreeFlowPictureTyped}
          params={{ width: DEFAULT_EVENT_IMAGE_WIDTH }}
          style={styles.bookingImage}
        />
      </View>
      {event?.type === EventType.WORKSHOP ? (
        <MyText style={styles.title} numberOfLines={2}>
          {event?.title}
        </MyText>
      ) : (
        <MyText style={styles.title} numberOfLines={2}>
          {event?.title || t('Free Flow Session')}
        </MyText>
      )}

      <MyText style={styles.date} numberOfLines={1}>
        {dateString}
      </MyText>
    </TouchableOpacity>
  );
});

export default EventGridItem;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio,
    overflow: 'hidden',
    borderRadius: 12,
  },
  bookingImage: {
    width: '100%',
    height: '100%',
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 1,
    fontWeight: '400',
  },
  title: {
    fontWeight: '400',
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 1,
  },
});
