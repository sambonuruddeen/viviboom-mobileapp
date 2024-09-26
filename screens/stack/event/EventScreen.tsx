import { Entypo, Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Calendar from 'expo-calendar';
import { DateTime } from 'luxon';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageRequireSource,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
import DefaultFreeFlowPicture from 'rn-viviboom/assets/images/default-freeflow.png';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import DefaultWorkshopPicture from 'rn-viviboom/assets/images/default-workshop.png';
import BranchLogoPicture from 'rn-viviboom/assets/images/vivita-logo.jpeg';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import Layout from 'rn-viviboom/constants/Layout';
import { BookingStatusType } from 'rn-viviboom/enums/BookingStatusType';
import { EventType } from 'rn-viviboom/enums/EventType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

import EventFooter from './EventFooter';
import EventHeader from './EventHeader';

const DefaultFreeFlowPictureTyped = DefaultFreeFlowPicture as ImageRequireSource;
const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DefaultWorkshopPictureTyped = DefaultWorkshopPicture as ImageRequireSource;

const BranchLogoPictureTyped = BranchLogoPicture as ImageRequireSource;

const DEFAULT_EVENT_IMAGE_SIZE = Layout.screen.width > 600 ? 1024 : 512;
const DEFAULT_EVENT_BACKGROUND_SIZE = 128;
const MODAL_EVENT_IMAGE_SIZE = 1024;
const DEFAULT_PROFILE_IMAGE_SIZE = 128;
const CALENDAR_TITLE = 'VIVIBOOM';

const screen = Dimensions.get('screen');
const headerHeight = 50;
const footerHeight = 60;
const imageWidth = screen.width - 2 * 18;
const imageHeight = (imageWidth * 2) / 3;

const LargeImagePreviewComponent = memo(({ uri }: { uri: string }) => (
  <View style={{ flex: 1, justifyContent: 'center' }}>
    <MyImage uri={uri} params={{ width: DEFAULT_EVENT_IMAGE_SIZE }} style={{ width: screen.width }} />
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator />
    </View>
  </View>
));

export default function EventScreen({ navigation, route }: RootStackScreenProps<'EventScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const isFocused = useIsFocused();

  const { preloadedData } = route.params;
  const user = useReduxStateSelector((state) => state.account);
  const isRootEnv = user.institutionId === 1;
  const insets = useSafeAreaInsets();
  const offset = useRef(new Animated.Value(0)).current;
  const touchPos = useRef([0, 0]);

  const [carouselHeight, setCarouselHeight] = useState(400);
  const [isEventLoading, setEventLoading] = useState(false);
  const [event, setEvent] = useState(preloadedData);
  const [userBooking, setUserBooking] = useState<UserEventBooking>(null);
  const [showCarouselModal, setShowCarouselModal] = useState(false);

  const backgroundHeight = useMemo(() => insets.top + headerHeight + imageHeight - 20, [insets.top]);

  const onBackPressed = () => {
    navigation.pop();
  };

  const onAddToCalendar = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        let appCalendarId = calendars.find((cal) => cal.title === CALENDAR_TITLE)?.id;
        if (!appCalendarId) {
          appCalendarId = await Calendar.createCalendarAsync({
            title: CALENDAR_TITLE,
            entityType: Calendar.EntityTypes.EVENT,
            name: CALENDAR_TITLE,
            source: { isLocalAccount: true, name: CALENDAR_TITLE, type: Calendar.SourceType.LOCAL },
            color: '#7353ff',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
            ownerAccount: CALENDAR_TITLE,
          });
        }
        await Calendar.createEventAsync(appCalendarId, {
          startDate: event?.startAt,
          endDate: DateTime.fromJSDate(new Date(event?.startAt)).plus({ hour: event?.duration }).toJSDate(),
          timeZone: event?.branch?.tzIANA,
          title: event?.title,
          url: `${Config.MobileAppUrl}/event/${event?.id}`,
        });
        Toast.show({ text1: t('The event has been added to your VIVIBOOM calendar!') });
      }
    } catch (err) {
      console.warn(err);
      Toast.show({ text1: t('Unsuccessful'), type: 'error' });
    }
  };

  const handleCancel = async () => {
    if (!isBooked) return;
    try {
      const res = await BookingApi.patch({ authToken: user?.authToken, bookingId: userBooking?.id, status: BookingStatusType.CANCELLED });

      if (res.data?.booking && res.data?.booking?.status === BookingStatusType.CANCELLED) {
        Toast.show({ text1: t('You have successfully cancelled your booking') });
        navigation.pop();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onPressCancel = () => {
    Alert.alert(t('Are you sure you want to cancel your booking?'), null, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      { text: 'OK', onPress: handleCancel, style: 'destructive' },
    ]);
  };

  // API calls
  const fetchEvent = useCallback(async () => {
    setEventLoading(true);
    try {
      const res = await EventApi.get({ authToken: user?.authToken, eventId: preloadedData?.id });
      setEvent(res.data);
    } catch (err) {
      console.log(err);
    }
    setEventLoading(false);
  }, [preloadedData?.id, user?.authToken]);

  const fetchBooking = useCallback(async () => {
    setEventLoading(true);
    try {
      const res = await BookingApi.getList({
        authToken: user?.authToken,
        eventId: event?.id,
        userId: user.id,
      });
      if (res.data.count > 0) setUserBooking(res.data.bookings?.[0]);
    } catch (err) {
      console.error(err);
    }
    setEventLoading(false);
  }, [user?.authToken, user.id, event?.id]);

  useEffect(() => {
    if (isFocused) fetchEvent();
  }, [fetchEvent, isFocused]);

  useEffect(() => {
    if (isFocused) fetchBooking();
  }, [fetchBooking, isFocused]);

  const backgroundTranslateY = offset.interpolate({
    inputRange: [0, backgroundHeight],
    outputRange: [0, -backgroundHeight],
    extrapolate: 'clamp',
  });

  const backgroundBottom = offset.interpolate({
    inputRange: [-100, 0],
    outputRange: [-50, 0],
    extrapolateRight: 'clamp',
  });

  const [dateString, timeString] = useMemo(() => {
    const res = ['-', '-'];
    try {
      const dateTime = DateTime.fromJSDate(new Date(event?.startAt));
      const endDateTime = dateTime.plus({ hour: event?.duration });
      res[0] = dateTime.toLocaleString(DateTime.DATE_HUGE);
      res[1] = `${dateTime.toLocaleString(DateTime.TIME_SIMPLE)} - ${endDateTime.toLocaleString(DateTime.TIME_SIMPLE)}`;
    } catch (err) {
      console.warn(err);
    }
    return res;
  }, [event?.duration, event?.startAt]);

  const disclaimerMessage = useMemo(
    () => t('Please cancel as at least 48 hours prior to your visit to enable other members to have a chance to take up the slot. Thank you!'),
    [t],
  );

  const isBooked = useMemo(() => userBooking && userBooking?.status !== BookingStatusType.CANCELLED, [userBooking]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <Modal
        visible={showCarouselModal}
        onRequestClose={() => setShowCarouselModal(false)}
        hardwareAccelerated
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View
          style={styles.modalContainer}
          onTouchStart={(e) => {
            touchPos.current = [e.nativeEvent.pageX, e.nativeEvent.pageY];
          }}
          onTouchEnd={(e) => {
            const [x0, y0] = touchPos.current;
            const { pageX: x1, pageY: y1 } = e.nativeEvent;
            const dx = x1 - x0;
            const dy = y1 - y0;
            const slope = Math.abs(dy / dx);
            // close the modal with some swipe down gesture threshold
            if (dy > 15 && slope > 3) setShowCarouselModal(false);
          }}
        >
          <MyImage
            uri={event?.imageUri}
            defaultSource={event?.type === EventType.WORKSHOP ? DefaultWorkshopPictureTyped : DefaultFreeFlowPictureTyped}
            params={{ width: MODAL_EVENT_IMAGE_SIZE }}
            style={{ width: screen.width }}
            preloadComponent={<LargeImagePreviewComponent uri={event?.imageUri} />}
            zoomEnabled
          />
          <View style={{ ...styles.headerContainer, paddingTop: insets.top, height: styles.headerContainer.height + insets.top }}>
            <View style={styles.backButton}>
              <TouchableOpacity onPress={() => setShowCarouselModal(false)}>
                <Ionicons name="ios-close-outline" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={[styles.background, { height: backgroundHeight }]}>
        <Animated.View style={[styles.imageContainer, { transform: [{ translateY: backgroundTranslateY }], bottom: backgroundBottom }]}>
          <MyImage uri={event?.imageUri} params={{ width: DEFAULT_EVENT_BACKGROUND_SIZE }} style={StyleSheet.absoluteFill} />
          <BlurView intensity={100} style={StyleSheet.absoluteFill} tint={colorScheme} />
        </Animated.View>
      </View>
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + headerHeight, paddingBottom: footerHeight + insets.bottom + Layout.bottomNavigatorBarHeight },
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], { useNativeDriver: false })}
      >
        <TouchableOpacity style={styles.eventImageContainer} activeOpacity={1} onPress={() => setShowCarouselModal(true)}>
          <MyImage
            uri={event?.imageUri}
            defaultSource={event?.type === EventType.WORKSHOP ? DefaultWorkshopPictureTyped : DefaultFreeFlowPictureTyped}
            params={{ width: DEFAULT_EVENT_IMAGE_SIZE }}
            style={styles.eventImage}
          />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          {event?.type === EventType.WORKSHOP ? (
            <MyText style={styles.titleText}>{event?.title}</MyText>
          ) : (
            <MyText style={styles.titleText}>{event?.title || t(`${event.branchId === 1 ? 'Tinker Time' : 'Free Flow'}`)}</MyText>
          )}
        </View>
        <View style={styles.branchRow} onLayout={(e) => setCarouselHeight(e.nativeEvent.layout.y)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MyImage defaultSource={BranchLogoPictureTyped} style={styles.avatar} />
            <MyText style={{ fontSize: 18 }}>
              {isRootEnv ? 'VIVITA ' : ''}
              {event?.branch?.name || ''}
            </MyText>
          </View>
          <MyButton
            mode="outlined"
            labelStyle={{ marginVertical: 0 }}
            style={{ height: 32, justifyContent: 'center' }}
            onPress={() => Linking.openURL(isRootEnv ? `https://vivita.${event?.branch?.countryISO?.toLocaleLowerCase() || 'sg'}` : Config.FrontEndUrl)}
          >
            {t('Home')}
          </MyButton>
        </View>
        <View style={styles.eventDate}>
          <Entypo name="calendar" size={16} color={Colors[colorScheme].textSecondary} />
          <View style={styles.dateAndTime}>
            <MyText style={{ fontSize: 16 }}>{dateString}</MyText>
            <MyText style={{ fontSize: 14, color: '#666', fontWeight: '400', marginVertical: 10 }}>{timeString}</MyText>
            <TouchableOpacity style={{ marginVertical: 6 }} onPress={onAddToCalendar}>
              <MyText style={{ fontSize: 16, color: Colors[colorScheme].tint }}>{t('Add to calendar')}</MyText>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.availability}>
          <Ionicons name="ios-person-outline" size={16} color={Colors[colorScheme].textSecondary} />
          <View style={styles.dateAndTime}>
            <MyText style={{ fontSize: 16 }}>{t('Availability')}</MyText>
            <MyText style={{ fontSize: 14, color: '#666', fontWeight: '400', marginVertical: 10 }}>
              {t('Slots left')}: {(event?.maxSlots ?? 0) - (event?.bookingCount ?? 0)}
            </MyText>
          </View>
        </View>
        <View style={styles.eventType}>
          <Ionicons
            name={event?.type === EventType.WORKSHOP ? 'ios-construct-outline' : 'ios-cafe-outline'}
            size={16}
            color={Colors[colorScheme].textSecondary}
          />
          <MyText style={{ fontSize: 16, marginLeft: 18 }}>
            {t(event?.type === EventType.WORKSHOP ? 'This is a workshop event' : 'This is a Free-Flow session')}
          </MyText>
        </View>
        {isBooked && (
          <View style={styles.cancelBooking}>
            <Ionicons name={'ios-trash-outline'} size={20} color={Colors[colorScheme].error} />
            <TouchableOpacity style={{ marginVertical: 6, marginLeft: 16 }} onPress={onPressCancel}>
              <MyText style={{ fontSize: 16, color: Colors[colorScheme].error }}>{t('Cancel Booking')}</MyText>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.aboutEvent}>
          <MyText style={styles.aboutTitle}>{t('About this event')}</MyText>
          <MyText style={{ ...styles.description, color: Colors[colorScheme].textSecondary }}>
            {event?.description || t('No description is added for this event')}
          </MyText>
        </View>
        {event?.facilitators?.length > 0 && (
          <View style={styles.facilitators}>
            <MyText style={styles.aboutTitle}>{t(event.institutionId === 1 ? 'Crew of the day' : 'Event facilitators')}</MyText>
            <View style={styles.facilitatorItems}>
              {event.facilitators.map((facilitator) => (
                <TouchableOpacity
                  key={`event-facilitator_${facilitator.id}`}
                  style={styles.facilitatorItem}
                  onPress={() => navigation.navigate('MemberScreen', { preloadedData: { id: facilitator.userId } })}
                  disabled={!facilitator.userId}
                  activeOpacity={0.8}
                >
                  <MyImage
                    uri={facilitator.profileImageUri}
                    defaultSource={DefaultProfilePictureTyped}
                    params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                    style={styles.facilitatorImage}
                  />
                  <MyText style={styles.facilitatorName}>{facilitator.name}</MyText>
                </TouchableOpacity>
              ))}
            </View>
            <MyText style={styles.facilitatorSubtitle}>
              {t(event.institutionId === 1 ? 'Ask the crew anything about' : 'Ask the facilitators anything about')}
            </MyText>
            <View style={styles.facilitatorSkills}>
              {event.facilitators.map((facilitator) => (
                <View key={`facilitator-skills_${facilitator.id}`} style={styles.skillItem}>
                  <MyText style={{ ...styles.description, marginRight: 6, color: Colors[colorScheme].textSecondary }}>-</MyText>
                  <MyText style={{ ...styles.description, flex: 1, color: Colors[colorScheme].textSecondary }}>
                    {facilitator.name}: {facilitator.skills || '-'}
                  </MyText>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.aboutEvent}>
          <MyText style={styles.aboutTitle}>{t('If you are unable to make it')}</MyText>
          <MyText style={{ ...styles.description, color: Colors[colorScheme].textSecondary }}>{disclaimerMessage}</MyText>
        </View>
      </ScrollView>
      <EventHeader event={event} userBooking={userBooking} onBackPressed={onBackPressed} animatedOffset={offset} carouselHeight={carouselHeight} />
      <EventFooter event={event} userBooking={userBooking} navigation={navigation} />
      {isEventLoading && <View style={[styles.hideAll, { backgroundColor: Colors[colorScheme].background }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  background: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: screen.width,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventImageContainer: {
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImage: {
    width: imageWidth,
    height: imageHeight,
  },
  hideAll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  titleContainer: {
    marginTop: 18,
    width: '100%',
    padding: 18,
  },
  titleText: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 48,
  },
  branchRow: {
    padding: 18,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 18,
  },
  eventDate: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 30,
    marginBottom: 18,
  },
  dateAndTime: {
    alignItems: 'flex-start',
    marginHorizontal: 18,
  },
  availability: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 18,
  },
  eventType: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 18,
  },
  cancelBooking: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 18,
    marginVertical: 24,
  },
  aboutEvent: {
    width: '100%',
    padding: 18,
    alignItems: 'flex-start',
  },
  aboutTitle: {
    fontSize: 18,
    marginVertical: 12,
  },
  description: {
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 20,
  },
  facilitators: {
    width: '100%',
    padding: 18,
    alignItems: 'flex-start',
  },
  facilitatorItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  facilitatorItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 8,
    borderRadius: 8,
  },
  facilitatorImage: {
    width: 58,
    height: 58,
    borderRadius: 30,
  },
  facilitatorName: {
    fontWeight: '400',
    marginTop: 12,
    fontSize: 17,
  },
  facilitatorSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    marginVertical: 8,
  },
  facilitatorSkills: {
    flexDirection: 'column',
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    width: 70,
  },
});
