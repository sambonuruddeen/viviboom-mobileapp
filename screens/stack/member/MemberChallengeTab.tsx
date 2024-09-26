import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import { ChallengeOrderType } from 'rn-viviboom/enums/ChallengeOrderType';
import ChallengeListItem from 'rn-viviboom/hoc/ChallengeListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import { backgroundHeight, tabBarHeight } from './constants';

const DEFAULT_BADGE_REQUEST_COUNT = 10;
const screen = Dimensions.get('screen');

interface MemberChallengeTabProps {
  member: User;
  scrollY: Animated.Value;
  onScrollEnd: () => void;
}

const MemberChallengeTab = forwardRef<ScrollView, MemberChallengeTabProps>(({ member, scrollY, onScrollEnd }, ref) => {
  const insets = useSafeAreaInsets();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);

  const [challenges, setChallenges] = useState<Array<Badge>>([]);
  const [isFetchingChallenges, setIsFetchingChallenges] = useState(false);
  const [isEndOfChallenges, setIsEndOfChallenges] = useState(false);

  const fetchChallenges = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingChallenges) return;
      if (!hardRefresh && isEndOfChallenges) return;
      setIsFetchingChallenges(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_BADGE_REQUEST_COUNT,
        offset: hardRefresh ? 0 : challenges.length,
        order: ChallengeOrderType.LATEST,
        awardedUserId: member?.id,
      };

      try {
        const res = await ChallengeApi.getList(requestParams);
        if (hardRefresh) {
          setChallenges(res.data.challenges);
        } else {
          setChallenges([...challenges, ...res.data.challenges]);
        }

        // check if end of list
        if (res.data.challenges.length < DEFAULT_BADGE_REQUEST_COUNT) {
          setIsEndOfChallenges(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingChallenges(false);
    },
    [isFetchingChallenges, isEndOfChallenges, authToken, challenges, member?.id],
  );

  useEffect(() => {
    const init = () => {
      fetchChallenges(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  const flatListRenderItem = ({ item, index }) => <ChallengeListItem preloadedData={item} />;
  const paddingTop = useMemo(() => backgroundHeight + tabBarHeight + insets.top, [insets]);

  return (
    <Animated.FlatList
      ListFooterComponent={!isEndOfChallenges ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={challenges}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchChallenges(false)}
      refreshing={isFetchingChallenges}
      onRefresh={() => fetchChallenges(true)}
      keyExtractor={(item) => `member-challenge_${item.id}`}
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

export default MemberChallengeTab;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
});
