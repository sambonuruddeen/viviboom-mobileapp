import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import Colors from 'rn-viviboom/constants/Colors';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import BadgeGridItem from 'rn-viviboom/hoc/BadgeGridItem';
import BadgeListItem from 'rn-viviboom/hoc/BadgeListItem';
import ChallengeGridItem from 'rn-viviboom/hoc/ChallengeGridItem';
import ChallengeListItem from 'rn-viviboom/hoc/ChallengeListItem';
import MemberListItem from 'rn-viviboom/hoc/MemberListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import ProjectSearchItem from 'rn-viviboom/hoc/ProjectSearchItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const DEFAULT_CHALLENGE_REQUEST_COUNT = 10;
const DEFAULT_BADGE_REQUEST_COUNT = 10;
const DEFAULT_MEMBER_REQUEST_COUNT = 2;
const DEFAULT_PROJECT_REQUEST_COUNT = 10;

interface DefaultSearchResultTabProps {
  searchKeyword: string;
  jumpTo: (key: string) => void;
}

export default function DefaultSearchResultTab({ searchKeyword, jumpTo }: DefaultSearchResultTabProps) {
  const colorScheme = useColorScheme();
  const isRootEnv = useReduxStateSelector((s) => s.account?.institutionId === 1);
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const [challenges, setChallenges] = useState<Badge[]>([]);
  const [isFetchingChallenges, setIsFetchingChallenges] = useState(false);
  const [isEndOfChallenges, setIsEndOfChallenges] = useState(false);

  const [badges, setBadges] = useState<Badge[]>([]);
  const [isFetchingBadges, setIsFetchingBadges] = useState(false);
  const [isEndOfBadges, setIsEndOfBadges] = useState(false);

  const [members, setMembers] = useState<User[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const [projects, setProjects] = useState<Array<Project>>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isEndOfProjects, setIsEndOfProjects] = useState(false);

  const fetchChallenges = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingChallenges) return;
      if (!hardRefresh && isEndOfChallenges) return;
      setIsFetchingChallenges(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_CHALLENGE_REQUEST_COUNT,
        offset: hardRefresh ? 0 : challenges.length,
        order: BadgeOrderType.LATEST,
        keywords: searchKeyword,
        verboseAttributes: ['awardedUsers'],
      };

      try {
        const res = await ChallengeApi.getList(requestParams);
        if (hardRefresh) {
          setChallenges(res.data.challenges);
        } else {
          setChallenges([...challenges, ...res.data.challenges]);
        }
        if (res.data.challenges.length < DEFAULT_BADGE_REQUEST_COUNT) {
          setIsEndOfChallenges(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingChallenges(false);
    },
    [authToken, challenges, isEndOfChallenges, isFetchingChallenges, searchKeyword],
  );

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
        verboseAttributes: ['awardedUsers'],
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

  const fetchMembers = useCallback(async () => {
    if (isFetchingMembers) return;
    setIsFetchingMembers(true);

    const requestParams = {
      authToken,
      limit: DEFAULT_MEMBER_REQUEST_COUNT,
      offset: 0,
      username: searchKeyword,
      orderKey: 'givenName',
      orderDirection: 'ASC',
    };

    try {
      const res = await UserApi.getList(requestParams);
      setMembers(res.data.users);
      setMemberCount(res.data.count);
    } catch (err) {
      console.error(err);
    }
    setIsFetchingMembers(false);
  }, [authToken, isFetchingMembers, searchKeyword]);

  const fetchProjects = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingProjects) return;
      if (!hardRefresh && isEndOfProjects) return;
      setIsFetchingProjects(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_PROJECT_REQUEST_COUNT,
        offset: hardRefresh ? 0 : projects.length,
        order: ProjectOrderType.LATEST,
        verboseAttributes: ['badges'],
        keywords: searchKeyword,
      };

      try {
        const res = await ProjectApi.getList(requestParams);
        if (hardRefresh) {
          setProjects(res.data.projects);
        } else {
          setProjects([...projects, ...res.data.projects]);
        }

        // check if end of list
        if (res.data.projects.length < DEFAULT_PROJECT_REQUEST_COUNT) {
          setIsEndOfProjects(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingProjects(false);
    },
    [isFetchingProjects, isEndOfProjects, authToken, projects, searchKeyword],
  );

  useEffect(() => {
    const init = () => {
      fetchChallenges(true);
      fetchBadges(true);
      fetchMembers();
      fetchProjects(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  const flatListHeaderComponent = useMemo(
    () => (
      <View style={styles.container}>
        {!!challenges.length && (
          <View style={[styles.badgeContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <View style={[styles.topRow, { marginBottom: 0 }]}>
              <View style={styles.title}>
                <MaterialCommunityIcons name="puzzle-outline" size={15} color={Colors[colorScheme].text} />
                <MyText style={{ ...styles.titleText, marginLeft: 4 }}>Challenges</MyText>
              </View>
              {challenges.length > 3 && (
                <TouchableOpacity style={styles.showAllButton} onPress={() => jumpTo('Challenge')}>
                  <MyText style={styles.showAllText}>Show All</MyText>
                </TouchableOpacity>
              )}
            </View>
            {challenges.length > 1 && (
              <View style={styles.challengeScroll}>
                <ScrollView horizontal contentContainerStyle={{ paddingLeft: 12 }}>
                  {challenges.map((v) => (
                    <View key={`result-challenge_${v.id}`} style={styles.challengeItem}>
                      <ChallengeGridItem preloadedData={v} width={164} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            {challenges.length === 1 && <ChallengeListItem id={challenges[0].id} preloadedData={challenges[0]} />}
          </View>
        )}
        {!!badges.length && (
          <View style={[styles.badgeContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <View style={styles.topRow}>
              <View style={styles.title}>
                <Ionicons name="ios-ribbon-outline" size={15} color={Colors[colorScheme].text} />
                <MyText style={styles.titleText}>Badges</MyText>
              </View>
              {badges.length > 3 && (
                <TouchableOpacity style={styles.showAllButton} onPress={() => jumpTo('Badge')}>
                  <MyText style={styles.showAllText}>Show All</MyText>
                </TouchableOpacity>
              )}
            </View>
            {badges.length > 1 && (
              <View style={styles.badgeScroll}>
                <ScrollView horizontal contentContainerStyle={{ paddingLeft: 12 }}>
                  {badges.map((v) => (
                    <View key={`result-badge_${v.id}`} style={styles.badgeItem}>
                      <BadgeGridItem id={v.id} preloadedData={v} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            {badges.length === 1 && <BadgeListItem id={badges[0].id} preloadedData={badges[0]} />}
          </View>
        )}
        {!!members.length && (
          <View style={[styles.memberContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <View style={styles.topRow}>
              <View style={styles.title}>
                <Ionicons name="ios-person-outline" size={15} color={Colors[colorScheme].text} />
                <MyText style={styles.titleText}>{isRootEnv ? 'VIVINAUTS' : 'Creators'}</MyText>
              </View>
            </View>
            {members.map((v) => (
              <MemberListItem key={`result-default-member_${v.id}`} preloadedData={v} />
            ))}
            {!!memberCount && memberCount > 2 && (
              <TouchableOpacity style={styles.memberMore} onPress={() => jumpTo('VIVINAUT')}>
                <MyText style={styles.memberMoreText}>
                  Show All {memberCount} {isRootEnv ? 'VIVINAUTS' : 'Creators'}
                </MyText>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!!projects.length && (
          <View style={[styles.projectContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <View style={styles.topRow}>
              <View style={styles.title}>
                <Ionicons name="ios-reader-outline" size={15} color={Colors[colorScheme].text} />
                <MyText style={styles.titleText}>Projects</MyText>
              </View>
              {projects.length > 3 && (
                <TouchableOpacity style={styles.showAllButton} onPress={() => jumpTo('Project')}>
                  <MyText style={styles.showAllText}>Show All</MyText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    ),
    [badges, challenges, colorScheme, isRootEnv, jumpTo, memberCount, members, projects.length],
  );

  const flatListRenderItem = useCallback(
    ({ item, index }) => (
      <View style={{ backgroundColor: Colors[colorScheme].contentBackground }}>
        <ProjectSearchItem id={item.id} preloadedData={item} showProfile />
      </View>
    ),
    [colorScheme],
  );

  if (
    !isFetchingChallenges &&
    !isFetchingBadges &&
    !isFetchingMembers &&
    !isFetchingProjects &&
    !challenges?.length &&
    !badges?.length &&
    !projects?.length &&
    !members?.length
  ) {
    return <MyText style={styles.noItemFoundText}>No result found</MyText>;
  }

  return (
    <FlatList
      ListHeaderComponent={flatListHeaderComponent}
      ListFooterComponent={!isEndOfProjects ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={projects}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchProjects(false)}
      refreshing={isFetchingProjects}
      onRefresh={() => fetchProjects(true)}
      keyExtractor={(item) => `result-project_${item.id}`}
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
  memberContainer: {
    width: '100%',
    paddingTop: 12,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  showAllButton: {
    paddingHorizontal: 12,
  },
  showAllText: {
    color: '#666',
  },
  badgeScroll: {
    height: 192,
  },
  challengeScroll: {
    paddingVertical: 18,
  },
  title: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  titleText: {
    fontWeight: '400',
    fontSize: 15,
    marginLeft: 6,
  },
  badgeItem: {
    height: '100%',
    width: 160,
    marginRight: 12,
    paddingBottom: 12,
  },
  challengeItem: {
    marginRight: 18,
    borderRadius: 8,
    borderWidth: 0.75,
    borderColor: 'rgba(160, 160, 160, 0.5)',
  },
  projectContainer: {
    width: '100%',
    paddingTop: 12,
    marginTop: 12,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  memberMore: {
    width: '100%',
    alignItems: 'center',
    padding: 10,
  },
  memberMoreText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#aaa',
  },
});
