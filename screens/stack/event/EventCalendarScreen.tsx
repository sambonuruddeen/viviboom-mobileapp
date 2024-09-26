import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Agenda, AgendaEntry, CalendarProvider } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BookingStatusType } from 'rn-viviboom/enums/BookingStatusType';
import { EventOrderType } from 'rn-viviboom/enums/EventOrderType';
import { EventPublicAccessType } from 'rn-viviboom/enums/EventPublicAccessType';
import EventCalendarItem from 'rn-viviboom/hoc/EventCalendarItem';
import MyText from 'rn-viviboom/hoc/MyText';
import SelectBranchBottomSheetModal from 'rn-viviboom/hoc/SelectBranchBottomSheetModal';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const DEFAULT_EVENT_REQUEST_COUNT = 30;

export default function EventCalendarScreen({ navigation, route }: RootStackScreenProps<'EventCalendarScreen'>) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s.account);
  const isFocused = useIsFocused();
  const agendaRef = useRef<Agenda>();
  const bottomSheetRef = useRef<BottomSheetModal>();

  const [selectedBranch, setSelectedBranch] = useState(route.params.branch);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);

  // calendar data
  const [items, setItems] = useState({});
  const [markedDates, setMarkedDates] = useState({});

  const [currentMonth, setCurrentMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [isCalendarOpen, setCalendarOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsFetchingEvents(true);
    const monthStr = currentMonth.month < 10 ? `0${currentMonth.month}` : currentMonth.month; // ISO accept 0-padded month only
    const startDate = DateTime.fromISO(`${currentMonth.year}-${monthStr}`);
    const endDate = startDate.endOf('month'); // 23:59:59 of the last day

    const startDateISO = DateTime.now().startOf('day').toISO();
    const endDateISO = endDate.toISO();

    const requestParams = {
      authToken: account?.authToken,
      branchId: selectedBranch?.id || undefined,
      limit: DEFAULT_EVENT_REQUEST_COUNT,
      startDate: startDateISO,
      isBeforeBookingEnd: true,
      endDate: endDateISO,
      order: EventOrderType.OLDEST,
      publicAccessTypes: [EventPublicAccessType.BOOK, EventPublicAccessType.VIEW, EventPublicAccessType.NONE],
    };

    try {
      const res = await EventApi.getList(requestParams);

      const { events } = res.data;
      const itemResult: { [ISODate: string]: AgendaEntry[] } = {};
      const markResult: MarkedDates = {};
      events.forEach((event) => {
        const eventDate = DateTime.fromJSDate(new Date(event?.startAt));
        const dateString = eventDate.toISODate();
        if (!itemResult[dateString]) itemResult[dateString] = [];
        itemResult[dateString].push(event);
        // mark on the calendar
        markResult[dateString] = { marked: true };
      });

      // fetch user booking in this month
      const userBookingResult = await BookingApi.getList({
        authToken: account?.authToken,
        userId: account?.id,
        startDate: startDateISO,
        endDate: endDateISO,
        status: BookingStatusType.APPROVED,
      });

      const { bookings } = userBookingResult.data;

      // mark bookings
      bookings.forEach((booking) => {
        const eventDate = DateTime.fromJSDate(new Date(booking.event?.startAt));
        const dateString = eventDate.toISODate();
        markResult[dateString] = {
          ...(markResult[dateString] || {}),
          customStyles: { container: { borderWidth: 0.5, borderColor: Colors[colorScheme].tint } },
        };
      });

      setItems(itemResult);
      setMarkedDates(markResult);
    } catch (err) {
      console.error(err);
    }
    setIsFetchingEvents(false);
  }, [currentMonth?.month, currentMonth?.year, account?.authToken, account?.id, selectedBranch?.id, colorScheme]);

  const toggleAgenda = () => {
    if (agendaRef.current?.state?.calendarScrollable) {
      agendaRef.current?.setScrollPadPosition(agendaRef.current?.initialScrollPadPosition(), true);
      agendaRef.current?.setState({ calendarScrollable: false });
      // agendaRef.current?.calendar?.scrollToDay(agendaRef.current?.state.selectedDay.clone(), agendaRef.current?.calendarOffset(), true);
      setCalendarOpen(false);
    } else {
      agendaRef.current?.setScrollPadPosition(0, true);
      agendaRef.current?.enableCalendarScrolling();
      setCalendarOpen(true);
    }
  };

  useEffect(() => {
    if (isFocused) fetchEvents();
  }, [isFocused, fetchEvents]);

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerTintColor: Colors[colorScheme].text,
      headerStyle: { backgroundColor: Colors[colorScheme].secondaryBackground },
      headerShadowVisible: false,
      headerBackTitle: `${DateTime.local(2017, currentMonth.month, 1).toFormat('LLL')} ${currentMonth.year}`,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.branchRow} onPress={() => bottomSheetRef.current?.present()}>
            <Ionicons name="ios-location" size={16} style={{ marginHorizontal: 8, color: Colors[colorScheme].tint }} />
            <MyText style={{ ...styles.branchText, color: Colors[colorScheme].tint }}>{selectedBranch?.name || 'All Branches'}</MyText>
            <Ionicons name="ios-chevron-down" size={16} style={{ marginHorizontal: 4, color: Colors[colorScheme].tint }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: isCalendarOpen ? undefined : Colors[colorScheme].tint }]}
            activeOpacity={1}
            onPress={toggleAgenda}
          >
            <Ionicons name="ios-list-outline" size={24} color={isCalendarOpen ? Colors[colorScheme].tint : Colors[colorScheme].textInverse} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [colorScheme, currentMonth.month, currentMonth.year, isCalendarOpen, navigation, selectedBranch?.name, t]);

  useEffect(() => {
    setTimeout(toggleAgenda, 500);
  }, []);

  const todayDateString = useMemo(() => DateTime.now().toISODate(), []);

  return (
    <>
      <View style={styles.container}>
        <CalendarProvider date="">
          <Agenda
            ref={agendaRef}
            selected={todayDateString}
            items={items}
            minDate={todayDateString}
            hideExtraDays={false}
            pastScrollRange={2}
            futureScrollRange={6}
            style={{ width: Layout.screen.width }}
            loadItemsForMonth={({ year, month }) => setCurrentMonth({ year, month })}
            onCalendarToggled={(enabled) => setCalendarOpen(enabled)}
            renderEmptyData={() => (
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: Colors[colorScheme].secondaryBackground }}>
                <MyText style={{ color: Colors[colorScheme].textSecondary, margin: 36 }}>{t('No event found on this day')}</MyText>
              </View>
            )}
            refreshing={isFetchingEvents}
            onRefresh={fetchEvents}
            markingType="custom"
            markedDates={markedDates}
            renderItem={(item) => <EventCalendarItem preloadedData={item} />}
            theme={{
              contentStyle: { backgroundColor: Colors[colorScheme].secondaryBackground },
              backgroundColor: Colors[colorScheme].background,
              calendarBackground: Colors[colorScheme].background,
              selectedDayBackgroundColor: Colors[colorScheme].tint,
              selectedDayTextColor: Colors[colorScheme].textInverse,
              dotColor: Colors[colorScheme].tint,
              todayTextColor: Colors[colorScheme].tint,
              dayTextColor: Colors[colorScheme].text,
              textDisabledColor: colorScheme === 'light' ? '#ccc' : '#666',
              monthTextColor: Colors[colorScheme].tint,
              agendaTodayColor: Colors[colorScheme].textSecondary,
            }}
          />
        </CalendarProvider>
      </View>
      <SelectBranchBottomSheetModal
        ref={bottomSheetRef}
        selectedBranch={selectedBranch}
        onSelectBranch={(branch) => {
          setSelectedBranch(branch);
          bottomSheetRef.current?.close();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  branchText: {
    fontSize: 16,
  },
  toggleButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
});
