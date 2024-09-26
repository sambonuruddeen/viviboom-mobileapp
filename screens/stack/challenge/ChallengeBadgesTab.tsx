import { forwardRef, useMemo } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BadgeListItem from 'rn-viviboom/hoc/BadgeListItem';
import MyText from 'rn-viviboom/hoc/MyText';

import { backgroundHeight, tabBarHeight } from './constants';

const screen = Dimensions.get('screen');

interface ChallengeBadgesTabProps {
  challenge: Badge;
  scrollY: Animated.Value;
  onScrollEnd: () => void;
}

// the listing here better change to fetch members by challenge id, but currently this is not implemented in backend
const ChallengeBadgesTab = forwardRef<ScrollView, ChallengeBadgesTabProps>(({ challenge, scrollY, onScrollEnd }, ref) => {
  const insets = useSafeAreaInsets();

  const paddingTop = useMemo(() => backgroundHeight + tabBarHeight + insets.top, [insets]);

  return (
    <Animated.ScrollView
      contentContainerStyle={{ width: '100%', paddingTop, minHeight: screen.height + paddingTop }}
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      showsVerticalScrollIndicator={false}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollEnd={onScrollEnd}
      ref={ref}
    >
      {challenge?.challengeBadges?.length > 0 && challenge?.challengeBadges?.map((v) => <BadgeListItem key={`challenge-badges_${v.id}`} preloadedData={v} compact />)}
      {!challenge?.challengeBadges?.length && <MyText style={styles.noItemFoundText}>There is no skill badge associated with this challenge yet</MyText>}
    </Animated.ScrollView>
  );
});

export default ChallengeBadgesTab;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 24,
  },
});
