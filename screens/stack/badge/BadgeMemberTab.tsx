import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import MemberListItem from 'rn-viviboom/hoc/MemberListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import { backgroundHeight, tabBarHeight } from './constants';

const DEFAULT_MEMBER_REQUEST_COUNT = 10;
const screen = Dimensions.get('screen');

interface BadgeMemberTabProps {
  badge: Badge;
  scrollY: Animated.Value;
  onScrollEnd: () => void;
}

// the listing here better change to fetch members by badge id, but currently this is not implemented in backend
const BadgeMemberTab = forwardRef<ScrollView, BadgeMemberTabProps>(({ badge, scrollY, onScrollEnd }, ref) => {
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
      {!!badge?.awardedUsers && badge?.awardedUsers.map((v) => <MemberListItem key={`badge-awarded-user_${v.id}`} preloadedData={v} hideStats />)}
    </Animated.ScrollView>
  );
});

export default BadgeMemberTab;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
});
