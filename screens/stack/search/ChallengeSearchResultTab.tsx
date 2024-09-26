import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import Colors from 'rn-viviboom/constants/Colors';
import { ChallengeOrderType } from 'rn-viviboom/enums/ChallengeOrderType';
import ChallengeListItem from 'rn-viviboom/hoc/ChallengeListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const DEFAULT_CHALLENGE_REQUEST_COUNT = 10;

interface ChallengeSearchResultTabProps {
  searchKeyword: string;
}

export default function ChallengeSearchResultTab({ searchKeyword }: ChallengeSearchResultTabProps) {
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const [challenges, setChallenges] = useState<Badge[]>([]);
  const [isFetchingChallenges, setIsFetchingChallenges] = useState(false);
  const [isEndOfChallenges, setIsEndOfChallenges] = useState(false);

  const fetchChallenges = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingChallenges) return;
      if (!hardRefresh && isEndOfChallenges) return;
      setIsFetchingChallenges(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_CHALLENGE_REQUEST_COUNT,
        offset: hardRefresh ? 0 : challenges.length,
        order: ChallengeOrderType.LATEST,
        keywords: searchKeyword,
      };

      try {
        const res = await ChallengeApi.getList(requestParams);
        if (hardRefresh) {
          setChallenges(res.data.challenges);
        } else {
          setChallenges([...challenges, ...res.data.challenges]);
        }
        if (res.data.challenges.length < DEFAULT_CHALLENGE_REQUEST_COUNT) {
          setIsEndOfChallenges(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingChallenges(false);
    },
    [authToken, challenges, isEndOfChallenges, isFetchingChallenges, searchKeyword],
  );

  useEffect(() => {
    const init = () => {
      fetchChallenges(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  const flatListRenderItem = ({ item }) => (
    <View style={{ backgroundColor: Colors[colorScheme].contentBackground }}>
      <ChallengeListItem preloadedData={item} />
    </View>
  );

  if (!isFetchingChallenges && !challenges?.length) return <MyText style={styles.noItemFoundText}>No result found</MyText>;

  return challenges.length === 1 ? (
    <View style={[styles.challengeContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <View style={styles.title}>
        <Ionicons name="ios-ribbon-outline" size={15} color={Colors[colorScheme].text} />
        <MyText style={styles.titleText}>Challenges</MyText>
      </View>
      <ChallengeListItem id={challenges[0].id} preloadedData={challenges[0]} />
    </View>
  ) : (
    <FlatList
      ListFooterComponent={!isEndOfChallenges ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={challenges}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchChallenges(false)}
      refreshing={isFetchingChallenges}
      onRefresh={() => fetchChallenges(true)}
      keyExtractor={(item) => `challenge-result_${item.id}`}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  challengeContainer: {
    width: '100%',
    paddingTop: 12,
    marginTop: 12,
  },
  challengeScroll: {
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
});
