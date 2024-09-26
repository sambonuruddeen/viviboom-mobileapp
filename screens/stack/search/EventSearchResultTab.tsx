import { Ionicons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
import Colors from 'rn-viviboom/constants/Colors';
import { EventOrderType } from 'rn-viviboom/enums/EventOrderType';
import { EventPublicAccessType } from 'rn-viviboom/enums/EventPublicAccessType';
import { EventType } from 'rn-viviboom/enums/EventType';
import EventListItem from 'rn-viviboom/hoc/EventListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

const DEFAULT_EVENT_REQUEST_COUNT = 10;

const filters = [
  { key: 'Upcoming', params: { startDate: new Date().toISOString(), order: EventOrderType.OLDEST } },
  { key: 'Past', params: { startDate: undefined, endDate: new Date().toISOString(), order: EventOrderType.LATEST } },
  { key: 'Workshop', params: { category: EventType.WORKSHOP } },
  { key: 'Free-Flow', params: { category: EventType.FREE_FLOW } },
];

interface EventSearchResultTabProps {
  searchKeyword: string;
  selectedBranch: Branch;
  openBranchBottomSheet: () => void;
}

export default function EventSearchResultTab({ searchKeyword, selectedBranch, openBranchBottomSheet }: EventSearchResultTabProps) {
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);

  const [selectedFilterKey, setSelectedFilterKey] = useState(filters[0].key);

  const [events, setEvents] = useState<Array<MyEvent>>([]);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);
  const [isEndOfEvents, setIsEndOfEvents] = useState(false);

  const fetchEvents = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingEvents) return;
      if (!hardRefresh && isEndOfEvents) return;
      if (hardRefresh) setIsEndOfEvents(false);
      setIsFetchingEvents(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_EVENT_REQUEST_COUNT,
        offset: hardRefresh ? 0 : events.length,
        startDate: DateTime.now().startOf('day').toISO(),
        isBeforeBookingEnd: true,
        order: EventOrderType.OLDEST,
        title: searchKeyword,
        branchId: selectedBranch ? selectedBranch.id : undefined,
        ...(filters.find((f) => f.key === selectedFilterKey).params || {}),
        publicAccessTypes: [EventPublicAccessType.BOOK, EventPublicAccessType.VIEW, EventPublicAccessType.NONE],
      };

      try {
        const res = await EventApi.getList(requestParams);
        if (hardRefresh) {
          setEvents(res.data.events);
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
    [isFetchingEvents, isEndOfEvents, authToken, events, searchKeyword, selectedBranch, selectedFilterKey],
  );

  useEffect(() => {
    const init = () => {
      fetchEvents(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterKey, selectedBranch]);

  const flatListHeaderComponent = useMemo(
    () => (
      <View style={[styles.listHeader, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <View style={styles.filterHeader}>
          <View style={styles.orderContainer}>
            {filters.map((filter) => (
              <TouchableOpacity key={`filter_${filter.key}`} style={styles.filterButton} onPress={() => setSelectedFilterKey(filter.key)}>
                <MyText
                  style={{
                    ...styles.filterButtonText,
                    color: selectedFilterKey === filter.key ? Colors[colorScheme].tint : '#666',
                    fontWeight: selectedFilterKey === filter.key ? '500' : '400',
                  }}
                >
                  {filter.key}
                </MyText>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.countryFilter} activeOpacity={0.8} onPress={openBranchBottomSheet}>
            {selectedBranch ? (
              <MyText style={styles.countryText}>
                {CountryUtil.getCountryFlagEmoji(selectedBranch.countryISO)} {selectedBranch.name}
              </MyText>
            ) : (
              <>
                <MyText style={styles.countryText}>Branch</MyText>
                <Ionicons name="ios-flag-outline" size={14} color="#666" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    ),
    [openBranchBottomSheet, selectedBranch, selectedFilterKey, colorScheme],
  );

  const flatListRenderItem = useCallback(
    ({ item, index }) => (
      <View style={{ backgroundColor: Colors[colorScheme].contentBackground }}>
        <EventListItem id={item.id} preloadedData={item} />
      </View>
    ),
    [colorScheme],
  );

  return (
    <FlatList
      ListHeaderComponent={flatListHeaderComponent}
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
      keyExtractor={(item) => `result-event_${item.id}`}
    />
  );
}

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  listHeader: {
    width: '100%',
  },
  filterHeader: {
    height: 40,
    width: '100%',
    borderBottomColor: 'rgba(160, 160, 160, 0.2)',
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  orderContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  filterButton: {
    marginRight: 18,
  },
  filterButtonText: {
    fontWeight: '400',
    fontSize: 12,
    color: '#666',
  },
  countryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftColor: '#ddd',
    borderLeftWidth: 1,
  },
  countryText: {
    fontWeight: '400',
    fontSize: 14,
    color: '#666',
    marginRight: 4,
    marginLeft: 12,
  },
});
