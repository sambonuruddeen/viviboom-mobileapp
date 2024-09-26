import { ReactElement, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import BadgeGridItem from 'rn-viviboom/hoc/BadgeGridItem';
import ChallengeGridItem from 'rn-viviboom/hoc/ChallengeGridItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import BadgeReduxActions from 'rn-viviboom/redux/badge/BadgeReduxActions';

const DEFAULT_LIMIT = 18;

const padding = 12;
const itemWidth = Layout.screen.width / 2 - 1.5 * padding;

export interface BadgeFilterType {
  category: BadgeCategory;
  difficulty: { id: number; name: string; value: string };
  timeToComplete: { id: number; name: string; lowerLimit?: number; upperLimit?: number };
  order: { id: number; name: string; value: string };
}

interface BadgeListProps {
  isChallenge: boolean;
  searchKeywords: string;
  ListHeaderComponent: ReactElement;
  isSelectBadge?: boolean;
  selectedBadges?: Badge[];
  setSelectedBadges?: (badges: Badge[]) => void;
}

const BadgeList = memo(
  ({
    isChallenge,
    searchKeywords,
    category,
    difficulty,
    timeToComplete,
    order,
    ListHeaderComponent,
    isSelectBadge,
    selectedBadges,
    setSelectedBadges,
  }: BadgeFilterType & BadgeListProps) => {
    const colorScheme = useColorScheme();
    const user = useReduxStateSelector((s) => s.account);
    const offlineData = useReduxStateSelector((s) => (isChallenge ? s?.badge?.challenges : s?.badge?.badges) || []);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [isFetchingBadges, setIsFetchingBadges] = useState(false);
    const [isEndOfBadges, setIsEndOfBadges] = useState(false);

    const fetchBadges = useCallback(
      async (hardRefresh = false) => {
        if (isFetchingBadges) return;
        if (!hardRefresh && isEndOfBadges) return;
        if (hardRefresh) setIsEndOfBadges(false);

        const requestParams = {
          authToken: user?.authToken,
          order: BadgeOrderType.LATEST,
          limit: DEFAULT_LIMIT,
          offset: hardRefresh ? 0 : badges.length,
          verboseAttributes: ['awardedUsers'],
          keywords: undefined,
          badgeCategoryId: undefined,
          awardedUserId: undefined,
          difficulty: undefined,
          completionTimeLowerLimit: undefined,
          completionTimeUpperLimit: undefined,
        };

        if (searchKeywords?.length > 0) requestParams.keywords = searchKeywords;

        if (category.id) requestParams.badgeCategoryId = category.id;

        if (difficulty.id) requestParams.difficulty = difficulty.value;

        if (timeToComplete.id) {
          requestParams.completionTimeLowerLimit = timeToComplete.lowerLimit;
          requestParams.completionTimeUpperLimit = timeToComplete.upperLimit;
        }

        if (order.id) requestParams.order = order.value;

        setIsFetchingBadges(true);
        try {
          const data: Badge[] = isChallenge ? (await ChallengeApi.getList(requestParams)).data.challenges : (await BadgeApi.getList(requestParams)).data.badges;
          if (hardRefresh) {
            setBadges(data);
            if (!category.id && !difficulty.id && !timeToComplete.id && !order.id) {
              if (isChallenge) {
                BadgeReduxActions.saveChallenges(data);
              } else {
                BadgeReduxActions.saveBadges(data);
              }
            }
          } else {
            setBadges([...badges, ...data]);
          }

          if (data.length < DEFAULT_LIMIT) {
            setIsEndOfBadges(true);
          }
        } catch (err) {
          console.error(err);
        }
        setIsFetchingBadges(false);
      },
      [
        isFetchingBadges,
        isEndOfBadges,
        user?.authToken,
        badges,
        searchKeywords,
        category.id,
        difficulty.id,
        difficulty.value,
        timeToComplete.id,
        timeToComplete.lowerLimit,
        timeToComplete.upperLimit,
        order.id,
        order.value,
        isChallenge,
      ],
    );

    useEffect(() => {
      const init = () => {
        fetchBadges(true);
      };
      init();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, difficulty, timeToComplete, order, searchKeywords]);

    useEffect(() => {
      setBadges(offlineData);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flatListRenderItem = useCallback(
      ({ item }: { item: Badge }) => {
        const isSelected = !!selectedBadges?.find((b) => b.id === item.id);
        const onItemPress = () => {
          if (isSelected) setSelectedBadges(selectedBadges?.filter((b) => b.id !== item.id));
          else setSelectedBadges(selectedBadges?.concat(item));
        };

        return (
          <View style={[isChallenge ? styles.itemContainer : styles.badgeItemContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            {isChallenge ? <ChallengeGridItem preloadedData={item} width={itemWidth} /> : <BadgeGridItem preloadedData={item} largeIcon />}
            {isSelectBadge && (
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onItemPress}>
                <View
                  style={
                    isSelected ? [styles.radioButton, { backgroundColor: Colors[colorScheme].tint, opacity: 0.8, borderColor: 'gray' }] : styles.radioButton
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        );
      },
      [colorScheme, isChallenge, isSelectBadge, selectedBadges, setSelectedBadges],
    );

    const ListEmptyComponent = useMemo(() => <MyText style={styles.noItemFoundText}>Nothing found here</MyText>, []);

    return (
      <FlatList
        showsVerticalScrollIndicator={false}
        data={badges}
        renderItem={flatListRenderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={() => isFetchingBadges && <ActivityIndicator size="large" style={{ margin: 50 }} />}
        onEndReached={() => fetchBadges(false)}
        keyExtractor={(item: Badge) => `select-badge_${item.id}`}
        refreshing={isFetchingBadges}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: padding }}
      />
    );
  },
);

export default BadgeList;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 36,
    fontSize: 12,
  },
  itemContainer: {
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: itemWidth,
    borderRadius: 8,
  },
  badgeItemContainer: {
    marginVertical: 8,
    width: itemWidth,
    borderRadius: 8,
  },
  radioButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'gray',
    opacity: 0.3,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
