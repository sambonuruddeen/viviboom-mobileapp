import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { EventOrderType } from 'rn-viviboom/enums/EventOrderType';
import { EventPublicAccessType } from 'rn-viviboom/enums/EventPublicAccessType';
import { EventType } from 'rn-viviboom/enums/EventType';
import EventListItem from 'rn-viviboom/hoc/EventListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import EventReduxAction from 'rn-viviboom/redux/event/EventReduxActions';

const DEFAULT_EVENT_REQUEST_COUNT = 20;

const EventListScreen = ({ navigation, route }: RootStackScreenProps<'EventListScreen'>) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s.account);
  const offlineData = useReduxStateSelector((s) => s.event?.homeEvents);

  const [eventCount, setEventCount] = useState(0);
  const [events, setEvents] = useState<Array<MyEvent>>([]);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);
  const [isEndOfEvents, setIsEndOfEvents] = useState(false);

  const title = useMemo(() => {
    let res = '';
    if (route.params?.type === EventType.WORKSHOP) res = t('Workshops');
    else res = t(`${route.params.branchId === 1 ? 'Tinker Time' : 'Free Flow'}`);
    return res;
  }, [route.params?.type, t]);

  useEffect(() => {
    navigation.setOptions({
      title,
      headerTintColor: Colors[colorScheme].text,
      headerStyle: { backgroundColor: Colors[colorScheme].secondaryBackground },
      headerShadowVisible: false,
      headerBackTitle: '',
    });
  }, [colorScheme, navigation, title]);

  useEffect(() => {
    const init = () => {
      setEvents(offlineData);
      fetchEvents(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingEvents) return;
      if (!hardRefresh && isEndOfEvents) return;
      setIsFetchingEvents(true);

      const requestParams = {
        authToken: account?.authToken,
        branchId: route.params.branchId || undefined,
        limit: DEFAULT_EVENT_REQUEST_COUNT,
        startDate: DateTime.now().startOf('day').toISO(),
        isBeforeBookingEnd: true,
        category: route.params?.type,
        offset: hardRefresh ? 0 : events.length,
        order: EventOrderType.OLDEST,
        publicAccessTypes: [EventPublicAccessType.BOOK, EventPublicAccessType.VIEW, EventPublicAccessType.NONE],
      };

      try {
        const res = await EventApi.getList(requestParams);
        if (hardRefresh) {
          const newEvents = res.data.events;
          setEventCount(res.data.count);
          EventReduxAction.save({ homeEvents: newEvents });
          setEvents(newEvents);
        } else {
          setEvents([...events, ...res.data.events]);
        }

        // check if end of list
        if (res.data.events.length < DEFAULT_EVENT_REQUEST_COUNT) {
          setIsEndOfEvents(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingEvents(false);
    },
    [isFetchingEvents, isEndOfEvents, account?.authToken, route.params.branchId, route.params?.type, events],
  );

  const flatListRenderItem = useCallback(
    ({ item, index }) => (
      <View style={{ backgroundColor: Colors[colorScheme].contentBackground, width: Layout.screen.width }}>
        <EventListItem id={item.id} preloadedData={item} />
      </View>
    ),
    [colorScheme],
  );

  return (
    <FlatList
      ListFooterComponent={
        !isEndOfEvents ? null : (
          <MyText style={styles.noItemFoundText}>{!isFetchingEvents && !events.length ? 'No result found' : 'Yay! You have seen it all!'}</MyText>
        )
      }
      data={events}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchEvents(false)}
      refreshing={isFetchingEvents}
      onRefresh={() => fetchEvents(true)}
      keyExtractor={(item: MyEvent) => `event_${item.id}`}
    />
  );
};

export default EventListScreen;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  listTitle: {
    marginVertical: 8,
  },
});
