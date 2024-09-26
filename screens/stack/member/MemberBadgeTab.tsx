import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import BadgeListItem from 'rn-viviboom/hoc/BadgeListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import { backgroundHeight, tabBarHeight } from './constants';

const DEFAULT_BADGE_REQUEST_COUNT = 10;
const screen = Dimensions.get('screen');

interface MemberBadgeTabProps {
  member: User;
  scrollY: Animated.Value;
  onScrollEnd: () => void;
}

const MemberBadgeTab = forwardRef<ScrollView, MemberBadgeTabProps>(({ member, scrollY, onScrollEnd }, ref) => {
  const insets = useSafeAreaInsets();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);

  const [badges, setBadges] = useState<Array<Badge>>([]);
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
        awardedUserId: member?.id,
      };

      try {
        const res = await BadgeApi.getList(requestParams);
        if (hardRefresh) {
          setBadges(res.data.badges);
        } else {
          setBadges([...badges, ...res.data.badges]);
        }

        // check if end of list
        if (res.data.badges.length < DEFAULT_BADGE_REQUEST_COUNT) {
          setIsEndOfBadges(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingBadges(false);
    },
    [isFetchingBadges, isEndOfBadges, authToken, badges, member?.id],
  );

  useEffect(() => {
    const init = () => {
      fetchBadges(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  const flatListRenderItem = ({ item, index }) => <BadgeListItem id={item.id} preloadedData={item} compact />;
  const paddingTop = useMemo(() => backgroundHeight + tabBarHeight + insets.top, [insets]);

  return (
    <Animated.FlatList
      ListFooterComponent={!isEndOfBadges ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={badges}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchBadges(false)}
      refreshing={isFetchingBadges}
      onRefresh={() => fetchBadges(true)}
      keyExtractor={(item) => `member-badge_${item.id}`}
      contentContainerStyle={{ width: '100%', paddingTop, minHeight: screen.height + paddingTop }}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      showsVerticalScrollIndicator={false}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollEnd={onScrollEnd}
      ref={ref}
    />
  );
});

export default MemberBadgeTab;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
});
