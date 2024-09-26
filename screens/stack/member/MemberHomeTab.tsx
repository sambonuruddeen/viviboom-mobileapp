import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultBadgePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import ChallengeGridItem from 'rn-viviboom/hoc/ChallengeGridItem';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import ProjectGridItem from 'rn-viviboom/hoc/ProjectGridItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import { backgroundHeight, tabBarHeight } from './constants';

const screen = Dimensions.get('screen');
const badgeImageParams = { width: 128, suffix: 'png' };

const BADGE_LIMIT = 8;
const PROJECT_LIMIT = 4;
const CHALLENGE_LIMIT = 4;

interface MemberHomeTabProps {
  member: User;
  scrollY: Animated.Value;
  onScrollEnd: () => void;
  jumpTo: (key: string) => void;
}

const MemberHomeTab = forwardRef<ScrollView, MemberHomeTabProps>(({ member, scrollY, onScrollEnd, jumpTo }, ref) => {
  const user = useReduxStateSelector((s) => s.account);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  const [isLoading, setLoading] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [wipProjects, setWipProjects] = useState<Project[]>([]);
  const [challenges, setChallenges] = useState<Badge[]>([]);

  const [completedProjectCount, setCompletedProjectCount] = useState(0);
  const [wipProjectCount, setWipProjectCount] = useState(0);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    const requestParams = {
      authToken: user?.authToken,
      limit: BADGE_LIMIT,
      offset: 0,
      awardedUserId: member?.id,
    };

    try {
      const res = await BadgeApi.getList(requestParams);
      setBadges(res.data.badges);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [member?.id, user?.authToken]);

  const fetchProjects = useCallback(
    async (isCompleted: boolean) => {
      setLoading(true);
      const requestParams = {
        authToken: user?.authToken,
        limit: PROJECT_LIMIT,
        offset: 0,
        order: ProjectOrderType.LATEST,
        authorUserId: member?.id,
        isCompleted,
        verboseAttributes: ['badges'],
      };

      try {
        const res = await ProjectApi.getList(requestParams);
        if (isCompleted) {
          setCompletedProjects(res.data.projects);
          setCompletedProjectCount(res.data.count);
        } else {
          setWipProjects(res.data.projects);
          setWipProjectCount(res.data.count);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    },
    [member?.id, user?.authToken],
  );

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    const requestParams = {
      authToken: user?.authToken,
      limit: CHALLENGE_LIMIT,
      offset: 0,
      awardedUserId: member?.id,
    };

    try {
      const res = await ChallengeApi.getList(requestParams);
      setChallenges(res.data.challenges.map((c) => ({ ...c, awardedUsers: [] })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [member?.id, user?.authToken]);

  useEffect(() => {
    fetchBadges();
    fetchProjects(true);
    fetchProjects(false);
    fetchChallenges();
  }, [fetchBadges, fetchChallenges, fetchProjects]);

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
      <View style={styles.content}>
        {!member?.challengeCount && !member?.badgeCount && !member?.projectCount && !completedProjectCount && !wipProjectCount && (
          <MyText style={{ textAlign: 'center' }}>Nothing found here</MyText>
        )}
        {!!member?.badgeCount && (
          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <View style={{ flexDirection: 'row' }}>
                <MyText style={{ ...styles.sectionTitle, color: Colors[colorScheme].textSecondary }}>Badges </MyText>
                <MyText style={styles.count}> {member?.badgeCount || 0}</MyText>
              </View>
              {member?.badgeCount > 8 && (
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => jumpTo('Badges')}>
                  <MyText style={styles.showMore}>Show More</MyText>
                  <Ionicons name="ios-chevron-forward-outline" size={16} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.badgeRow}>
              {badges.map((v) => (
                <TouchableOpacity
                  key={`member-home-badge_${v.id}`}
                  style={styles.badgeItemContainer}
                  onPress={() => navigation.push('BadgeScreen', { preloadedData: v })}
                  activeOpacity={0.8}
                >
                  <View>
                    <MyImage uri={v.imageUri} defaultSource={DefaultBadgePicture} params={badgeImageParams} style={styles.badgeImage} imageFormat="png" />
                  </View>
                  <MyText style={{ textAlign: 'center', fontWeight: '400', fontSize: 12 }}>{v.name}</MyText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {!!completedProjects.length && (
          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <View style={{ flexDirection: 'row' }}>
                <MyText style={{ ...styles.sectionTitle, color: Colors[colorScheme].textSecondary }}>Completed Project </MyText>
                <MyText style={styles.count}> {completedProjectCount || 0}</MyText>
              </View>
              {completedProjectCount > 4 && (
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => jumpTo('Projects')}>
                  <MyText style={styles.showMore}>Show More</MyText>
                  <Ionicons name="ios-chevron-forward-outline" size={16} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.projectGrid}>
              {completedProjects.map((p) => (
                <ProjectGridItem
                  key={`member-home-project_${p.id}`}
                  id={p.id}
                  preloadedData={p}
                  style={{ width: (screen.width - 3 * 18) / 2, marginBottom: 18 }}
                />
              ))}
            </View>
          </View>
        )}
        {!!wipProjects.length && (
          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <View style={{ flexDirection: 'row' }}>
                <MyText style={{ ...styles.sectionTitle, color: Colors[colorScheme].textSecondary }}>Work-In-Progress </MyText>
                <MyText style={styles.count}> {wipProjectCount || 0}</MyText>
              </View>
              {wipProjectCount > 4 && (
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => jumpTo('Projects')}>
                  <MyText style={styles.showMore}>Show More</MyText>
                  <Ionicons name="ios-chevron-forward-outline" size={16} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.projectGrid}>
              {wipProjects.map((p) => (
                <ProjectGridItem
                  key={`member-home-project_${p.id}`}
                  id={p.id}
                  preloadedData={p}
                  style={{ width: (screen.width - 3 * 18) / 2, marginBottom: 18 }}
                />
              ))}
            </View>
          </View>
        )}
        {!!member?.challengeCount && (
          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <View style={{ flexDirection: 'row' }}>
                <MyText style={{ ...styles.sectionTitle, color: Colors[colorScheme].textSecondary }}>Challenges Completed </MyText>
                <MyText style={styles.count}> {member?.challengeCount || 0}</MyText>
              </View>
              {member?.challengeCount > 4 && (
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => jumpTo('Challenges')}>
                  <MyText style={styles.showMore}>Show More</MyText>
                  <Ionicons name="ios-chevron-forward-outline" size={16} color="#aaa" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.projectGrid}>
              {challenges.map((v) => (
                <View key={`member-home-challenge_${v.id}`} style={styles.challengeItem}>
                  <ChallengeGridItem preloadedData={v} width={screen.width / 2 - 1.5 * 18} />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Animated.ScrollView>
  );
});

export default MemberHomeTab;

const styles = StyleSheet.create({
  content: {
    width: '100%',
    padding: 18,
  },
  sectionTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '400',
    fontSize: 14,
  },
  count: {
    fontSize: 14,
    color: '#aaa',
  },
  showMore: {
    fontWeight: '400',
    fontSize: 14,
    color: '#aaa',
  },
  section: {
    marginBottom: 18,
  },
  projectGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  badgeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
  },
  badgeItemContainer: {
    width: (screen.width - 18 * 2 - 3 * 12) / 4,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 3,
    borderRadius: 12,
  },
  badgeImage: {
    width: 40,
    height: 46,
    borderRadius: 12,
    margin: 12,
  },
  challengeItem: {
    borderWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.5)',
    borderRadius: 8,
    marginBottom: 18,
  },
});
