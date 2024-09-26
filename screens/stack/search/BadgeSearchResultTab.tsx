import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import Colors from 'rn-viviboom/constants/Colors';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import BadgeListItem from 'rn-viviboom/hoc/BadgeListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const DEFAULT_BADGE_REQUEST_COUNT = 10;

interface BadgeSearchResultTabProps {
  searchKeyword: string;
}

export default function BadgeSearchResultTab({ searchKeyword }: BadgeSearchResultTabProps) {
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isFetchingBadges, setIsFetchingBadges] = useState(false);
  const [isEndOfBadges, setIsEndOfBadges] = useState(false);

  const fetchBadges = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingBadges) return;
      if (!hardRefresh && isEndOfBadges) return;
      setIsFetchingBadges(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_BADGE_REQUEST_COUNT,
        offset: hardRefresh ? 0 : badges.length,
        order: BadgeOrderType.LATEST,
        keywords: searchKeyword,
      };

      try {
        const res = await BadgeApi.getList(requestParams);
        if (hardRefresh) {
          setBadges(res.data.badges);
        } else {
          setBadges([...badges, ...res.data.badges]);
        }
        if (res.data.badges.length < DEFAULT_BADGE_REQUEST_COUNT) {
          setIsEndOfBadges(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingBadges(false);
    },
    [authToken, badges, isEndOfBadges, isFetchingBadges, searchKeyword],
  );

  useEffect(() => {
    const init = () => {
      fetchBadges(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  const flatListRenderItem = ({ item }) => (
    <View style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <BadgeListItem id={item.id} preloadedData={item} />
    </View>
  );

  if (!isFetchingBadges && !badges?.length) return <MyText style={styles.noItemFoundText}>No result found</MyText>;

  return badges.length === 1 ? (
    <View style={[styles.badgeContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <View style={styles.title}>
        <Ionicons name="ios-ribbon-outline" size={15} color={Colors[colorScheme].text} />
        <MyText style={styles.titleText}>Badges</MyText>
      </View>
      <BadgeListItem id={badges[0].id} preloadedData={badges[0]} />
    </View>
  ) : (
    <FlatList
      ListFooterComponent={!isEndOfBadges ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={badges}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchBadges(false)}
      refreshing={isFetchingBadges}
      onRefresh={() => fetchBadges(true)}
      keyExtractor={(item) => `badge-result_${item.id}`}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  badgeContainer: {
    width: '100%',
    paddingTop: 12,
    marginTop: 12,
  },
  badgeScroll: {
    height: 192,
  },
  title: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  titleText: {
    fontWeight: '400',
    fontSize: 15,
    marginLeft: 6,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  listItem: {
    marginTop: 12,
  },
});
