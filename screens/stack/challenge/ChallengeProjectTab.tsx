import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import Colors from 'rn-viviboom/constants/Colors';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import MyText from 'rn-viviboom/hoc/MyText';
import ProjectListItem from 'rn-viviboom/hoc/ProjectListItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import { backgroundHeight, tabBarHeight } from './constants';

const DEFAULT_PROJECT_REQUEST_COUNT = 10;
const screen = Dimensions.get('screen');

const filters = [
  { key: 'Latest', params: { order: ProjectOrderType.LATEST } },
  { key: 'Oldest', params: { order: ProjectOrderType.OLDEST } },
  { key: 'Completed', params: { isCompleted: true } },
  { key: 'WIP', params: { isCompleted: false } },
];
interface ChallengeProjectTabProps {
  challenge: Badge;
  scrollY: Animated.Value;
  onScrollEnd: () => void;
}

const ChallengeProjectTab = forwardRef<ScrollView, ChallengeProjectTabProps>(({ challenge, scrollY, onScrollEnd }, ref) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);

  const [selectedFilterKey, setSelectedFilterKey] = useState(filters[0].key);

  const [projects, setProjects] = useState<Array<Project>>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isEndOfProjects, setIsEndOfProjects] = useState(false);

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
        badgeId: challenge?.id,
        ...(filters.find((f) => f.key === selectedFilterKey).params || {}),
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
    [isFetchingProjects, isEndOfProjects, authToken, projects, challenge?.id, selectedFilterKey],
  );

  useEffect(() => {
    const init = () => {
      fetchProjects(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterKey, challenge]);

  const flatListRenderItem = ({ item, index }) => <ProjectListItem id={item.id} preloadedData={item} showProfile />;

  const flatListHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.filterHeader}>
          <View style={styles.orderContainer}>
            {filters.map((filter) => (
              <TouchableOpacity key={`filter_${filter.key}`} style={styles.filterButton} onPress={() => setSelectedFilterKey(filter.key)}>
                <MyText
                  style={{
                    ...styles.filterButtonText,
                    color: selectedFilterKey === filter.key ? Colors[colorScheme].tint : '#666',
                    fontWeight: selectedFilterKey === filter.key ? '500' : '400',
                  }}
                >
                  {filter.key}
                </MyText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    ),
    [colorScheme, selectedFilterKey],
  );

  const paddingTop = useMemo(() => backgroundHeight + tabBarHeight + insets.top, [insets]);

  return (
    <Animated.FlatList
      ListHeaderComponent={flatListHeaderComponent}
      ListFooterComponent={!isEndOfProjects ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={projects}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchProjects(false)}
      keyExtractor={(item) => `challenge-project_${item.id}`}
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

export default ChallengeProjectTab;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  listHeader: {
    width: '100%',
  },
  filterHeader: {
    height: 40,
    width: '100%',
    borderBottomColor: 'rgba(160, 160, 160, 0.5)',
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  orderContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  filterButton: {
    marginRight: 18,
  },
  filterButtonText: {
    fontWeight: '400',
    fontSize: 12,
    color: '#666',
  },
  countryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftColor: '#ddd',
    borderLeftWidth: 1,
  },
  countryText: {
    fontWeight: '400',
    fontSize: 14,
    color: '#666',
    marginRight: 4,
    marginLeft: 12,
  },
});
