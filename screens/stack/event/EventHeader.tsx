import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Calendar from 'expo-calendar';
import { LinearGradient } from 'expo-linear-gradient';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import { BookingStatusType } from 'rn-viviboom/enums/BookingStatusType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const headerHeight = 40;
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);
const CALENDAR_TITLE = 'VIVIBOOM';

interface EventHeaderProps {
  event: MyEvent;
  userBooking: UserEventBooking;
  onBackPressed: () => void;
  animatedOffset: Animated.Value;
  carouselHeight: number;
}

export default function EventHeader({ event, userBooking, onBackPressed, animatedOffset, carouselHeight }: EventHeaderProps) {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const account = useReduxStateSelector((state) => state.account);

  const [isCancelLoading, setCancelLoading] = useState(false);

  const isBooked = useMemo(() => userBooking && userBooking?.status !== BookingStatusType.CANCELLED, [userBooking]);

  const handleCancel = async () => {
    if (!isBooked) return;
    setCancelLoading(true);
    try {
      const res = await BookingApi.patch({ authToken: account?.authToken, bookingId: userBooking?.id, status: BookingStatusType.CANCELLED });

      if (res.data?.booking && res.data?.booking?.status === BookingStatusType.CANCELLED) {
        Toast.show({ text1: t('You have successfully cancelled your booking') });
        navigation.pop();
      }
    } catch (err) {
      console.error(err);
    }

    setCancelLoading(false);
  };

  const onPressMore = async () => {
    showActionSheetWithOptions(
      {
        options: isBooked ? ['Close', 'Add To Calendar', 'Share', 'Cancel Booking'] : ['Close', 'Add To Calendar', 'Share'],
        destructiveButtonIndex: isBooked ? 3 : undefined,
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (isBooked && buttonIndex === 3) {
          // Cancel Booking
          Alert.alert(t('Are you sure you want to cancel your booking?'), null, [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            { text: 'OK', onPress: handleCancel, style: 'destructive' },
          ]);
        } else if (buttonIndex === 2) {
          // share
          try {
            const message = `Check out the ${event?.title} event on VIVIBOOM`;
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
        } else if (buttonIndex === 1) {
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
              Toast.show({ text1: t('The event has been added to your calendar!') });
            }
          } catch (err) {
            console.warn(err);
            Toast.show({ text1: t('Unsuccessful'), type: 'error' });
          }
        }
      },
    );
  };

  const heightUpperLimit = useMemo(() => Math.max(carouselHeight - insets.top - headerHeight, 0), [carouselHeight, insets.top]);

  return (
    <>
      <LinearGradient
        style={{ ...styles.gradient, height: styles.gradient.height + insets.top }}
        colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)', 'transparent']}
        locations={[0, 0.5, 1]}
      />
      <Animated.View
        style={{
          ...styles.container,
          paddingTop: insets.top,
          height: styles.container.height + insets.top,
          backgroundColor: Colors[colorScheme].secondaryBackground,
          opacity: animatedOffset.interpolate({
            inputRange: [0, heightUpperLimit],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
        }}
      />
      <View style={{ ...styles.container, paddingTop: insets.top, height: styles.container.height + insets.top }}>
        <View style={styles.button}>
          <TouchableOpacity onPress={onBackPressed}>
            <AnimatedIcon
              name="ios-chevron-back-outline"
              size={24}
              style={{
                color: animatedOffset.interpolate({
                  inputRange: [0, heightUpperLimit],
                  outputRange: ['#fff', Colors[colorScheme].text],
                  extrapolate: 'clamp',
                }),
              }}
            />
          </TouchableOpacity>
        </View>
        <Animated.View
          style={{
            opacity: animatedOffset.interpolate({
              inputRange: [heightUpperLimit - 30, heightUpperLimit],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          <MyText>{event?.title}</MyText>
        </Animated.View>
        <View style={styles.rightButton}>
          <TouchableOpacity style={styles.authorButton} onPress={onPressMore}>
            <AnimatedIcon
              name="ios-ellipsis-horizontal"
              size={24}
              style={{
                color: animatedOffset.interpolate({
                  inputRange: [0, heightUpperLimit],
                  outputRange: ['#fff', Colors[colorScheme].text],
                  extrapolate: 'clamp',
                }),
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: headerHeight * 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 50,
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  authorButton: {
    marginRight: 18,
  },
});
