import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import Colors from 'rn-viviboom/constants/Colors';
import { BookingStatusType } from 'rn-viviboom/enums/BookingStatusType';
import { EventQuestionDestinationType } from 'rn-viviboom/enums/EventQuestionDestinationType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';
import { MyEvent } from 'rn-viviboom/types/MyEvent';
import { UserEventBooking } from 'rn-viviboom/types/UserEventBookings';

interface EventFooterProps {
  event: MyEvent;
  userBooking: UserEventBooking;
  navigation: NativeStackNavigationProp<RootStackParamList, 'EventScreen', undefined>;
}

export default function EventFooter({ event, userBooking, navigation }: EventFooterProps) {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const account = useReduxStateSelector((state) => state.account);

  const [isLoading, setLoading] = useState(false);

  const isPastEvent = useMemo(() => !event?.bookingEndAt || new Date() > new Date(event?.bookingEndAt), [event]);

  const isFullyBooked = useMemo(() => event?.maxSlots <= event?.bookingCount, [event]);

  const buttonText = useMemo(() => {
    if (isLoading) return t('Loading');
    if (isPastEvent) return t('Event is over');
    if (userBooking?.status === BookingStatusType.APPROVED) return t('Confirmed');
    if (userBooking?.status === BookingStatusType.SUBMITTED) return t('Pending Approval');
    if (isFullyBooked) return t('Fully Booked');
    return t('Register');
  }, [isFullyBooked, isLoading, isPastEvent, t, userBooking?.status]);

  const buttonColor = useMemo(() => {
    if (isLoading) return '#aaa';
    if (isPastEvent) return '#aaa';
    if (userBooking?.status === BookingStatusType.APPROVED) return Colors[colorScheme].success;
    if (userBooking?.status === BookingStatusType.SUBMITTED) return Colors[colorScheme].tint;
    if (isFullyBooked) return '#ddd';
    return Colors[colorScheme].tint;
  }, [colorScheme, isFullyBooked, isLoading, isPastEvent, userBooking?.status]);

  const buttonTextColor = useMemo(() => {
    if (isLoading) return '#fff';
    if (isPastEvent) return '#fff';
    if (userBooking?.status === BookingStatusType.APPROVED) return '#fff';
    if (userBooking?.status === BookingStatusType.SUBMITTED) return '#fff';
    if (isFullyBooked) return '#fff';
    return Colors[colorScheme].textInverse;
  }, [colorScheme, isFullyBooked, isLoading, isPastEvent, userBooking?.status]);

  const isBookingDisabled =
    isLoading || isPastEvent || isFullyBooked || userBooking?.status === BookingStatusType.APPROVED || userBooking?.status === BookingStatusType.SUBMITTED;

  const onRegister = async () => {
    if (event?.eventQuestions?.filter((q) => q.destination === EventQuestionDestinationType.BOOKING)?.length) {
      navigation.navigate('EventQuestionScreen', { event });
    } else {
      // book
      setLoading(true);
      try {
        const res = await BookingApi.post({ authToken: account?.authToken, userId: account?.id, eventId: event?.id });

        navigation.push('BookingSuccessScreen', { booking: res.data?.booking, event });
      } catch (err) {
        Toast.show({ text1: err.response?.data?.message, type: 'error' });
      }
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: Colors[colorScheme].secondaryBackground,
        paddingBottom: insets.bottom,
        height: styles.container.height + insets.bottom,
      }}
    >
      <View>
        {isFullyBooked ? (
          <MyText style={{ color: Colors[colorScheme].error, fontSize: 16, lineHeight: 20 }}>{t('Fully Booked')}</MyText>
        ) : (
          <MyText style={{ fontSize: 16, lineHeight: 20 }}>
            {t(userBooking?.status === BookingStatusType.APPROVED || userBooking?.status === BookingStatusType.SUBMITTED ? 'Booked' : 'Book Now!')}
          </MyText>
        )}
        <MyText style={{ color: '#aaa', fontSize: 14, fontWeight: '400', lineHeight: 20 }}>{t('on VIVIBOOM')}</MyText>
      </View>
      <MyButton
        mode="contained"
        labelStyle={{ marginVertical: 0, width: 180, color: buttonTextColor }}
        style={[{ justifyContent: 'center', height: 36, alignItems: 'center', backgroundColor: buttonColor }]}
        disabled={isBookingDisabled}
        onPress={onRegister}
      >
        {buttonText}
      </MyButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(160, 160, 160, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
