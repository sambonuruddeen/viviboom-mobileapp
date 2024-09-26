import { forwardRef, useMemo } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChallengeListItem from 'rn-viviboom/hoc/ChallengeListItem';
import MyText from 'rn-viviboom/hoc/MyText';

import { backgroundHeight, tabBarHeight } from './constants';

const screen = Dimensions.get('screen');

interface BadgeChallengeTabProps {
  badge: Badge;
  scrollY: Animated.Value;
  onScrollEnd: () => void;
}

const BadgeChallengeTab = forwardRef<ScrollView, BadgeChallengeTabProps>(({ badge, scrollY, onScrollEnd }, ref) => {
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
      {badge?.challenges?.length > 0 && (
        <>
          <MyText style={styles.listTitle}>Relate to this badge</MyText>
          {badge?.challenges?.map((v) => (
            <ChallengeListItem key={`badges-challenges_${v.id}`} preloadedData={v} />
          ))}
        </>
      )}
      {!badge?.challenges?.length && <MyText style={styles.noItemFoundText}>There is no challenge associated with this badge yet</MyText>}
    </Animated.ScrollView>
  );
});

export default BadgeChallengeTab;

const styles = StyleSheet.create({
  listTitle: {
    paddingHorizontal: 18,
    marginTop: 18,
    fontSize: 16,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 24,
  },
});
