import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, Linking, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import PendingPicture from 'rn-viviboom/assets/images/pending.png';
import RocketPicture from 'rn-viviboom/assets/images/rocket.png';
import BranchLogoPicture from 'rn-viviboom/assets/images/vivita-logo.jpeg';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import { BookingStatusType } from 'rn-viviboom/enums/BookingStatusType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const PendingPictureTyped = PendingPicture as ImageRequireSource;
const RocketPictureTyped = RocketPicture as ImageRequireSource;
const BranchLogoPictureTyped = BranchLogoPicture as ImageRequireSource;
const CALENDAR_TITLE = 'VIVIBOOM';

const BookingSuccessScreen = ({ navigation, route }: RootStackScreenProps<'BookingSuccessScreen'>) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((s) => s.account);
  const isRootEnv = user.institutionId === 1;

  const booking = useMemo(() => route.params.booking, [route.params.booking]);
  const event = useMemo(() => route.params.event, [route.params.event]);

  const onShare = async () => {
    try {
      const message = `I am joining the event of ${event?.title}. Check it out on VIVIBOOM!`;
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

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={[styles.header, { height: styles.header.height + insets.top, paddingTop: insets.top }]}>
        <View style={styles.headerButton}>
          <TouchableOpacity onPress={() => navigation.pop()}>
            <Ionicons name="ios-close" size={20} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <MyImage defaultSource={booking?.status === BookingStatusType.APPROVED ? RocketPictureTyped : PendingPictureTyped} style={styles.icon} />
      </View>
      <View style={styles.titleContainer}>
        <MyText style={styles.title}>{booking?.status === BookingStatusType.APPROVED ? t('Booking Complete') : t('Booking Pending')}</MyText>
        <MyText style={{ ...styles.subtitle, color: Colors[colorScheme].textSecondary }}>
          {booking?.status === BookingStatusType.APPROVED ? t('See you at the event!') : t('Please await confirmation')}
        </MyText>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={onShare}>
            <Ionicons name="ios-share-outline" size={20} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onAddToCalendar}>
            <Ionicons name="ios-calendar-outline" size={20} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.eventInfo}>
        <MyText style={{ fontSize: 12, fontWeight: '400', color: Colors[colorScheme].textSecondary }}>
          {t('Thank you for registering {{title}} by', { title: event?.title })}
        </MyText>
        <View style={styles.branchRow}>
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
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom, backgroundColor: Colors[colorScheme].secondaryBackground }]}>
        <View style={{ padding: 18 }}>
          <MyButton mode="contained" onPress={() => navigation.replace('MyBookingScreen')}>
            {t('View your bookings')}
          </MyButton>
          <MyButton mode="text" onPress={() => navigation.pop()}>
            {t('Discover more events')}
          </MyButton>
        </View>
      </View>
    </View>
  );
};

export default BookingSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerButton: {
    width: 66,
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  icon: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    margin: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 6,
  },
  button: {
    marginHorizontal: 15,
    paddingVertical: 9,
    paddingLeft: 2,
    borderRadius: 24,
    backgroundColor: 'rgba(155, 155, 155, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  eventInfo: {
    width: '100%',
    alignItems: 'center',
    marginTop: 52,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
