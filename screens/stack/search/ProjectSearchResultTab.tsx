import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import Colors from 'rn-viviboom/constants/Colors';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import MyText from 'rn-viviboom/hoc/MyText';
import ProjectListItem from 'rn-viviboom/hoc/ProjectListItem';
import ProjectSearchItem from 'rn-viviboom/hoc/ProjectSearchItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

const DEFAULT_PROJECT_REQUEST_COUNT = 10;

const filters = [
  { key: 'Latest', params: { order: ProjectOrderType.LATEST } },
  { key: 'Oldest', params: { order: ProjectOrderType.OLDEST } },
  { key: 'Completed', params: { isCompleted: true } },
  { key: 'WIP', params: { isCompleted: false } },
];

interface ProjectSearchResultTabProps {
  searchKeyword: string;
  selectedBranch: Branch;
  openBranchBottomSheet: () => void;
}

export default function ProjectSearchResultTab({ searchKeyword, selectedBranch, openBranchBottomSheet }: ProjectSearchResultTabProps) {
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
      if (hardRefresh) setIsEndOfProjects(false);
      setIsFetchingProjects(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_PROJECT_REQUEST_COUNT,
        offset: hardRefresh ? 0 : projects.length,
        order: ProjectOrderType.LATEST,
        verboseAttributes: ['badges'],
        keywords: searchKeyword,
        branchId: selectedBranch ? selectedBranch.id : undefined,
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
    [isFetchingProjects, isEndOfProjects, authToken, projects, searchKeyword, selectedBranch, selectedFilterKey],
  );

  useEffect(() => {
    const init = () => {
      fetchProjects(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterKey, selectedBranch]);

  const flatListHeaderComponent = useMemo(
    () => (
      <View style={[styles.listHeader, { backgroundColor: Colors[colorScheme].contentBackground }]}>
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
          <TouchableOpacity style={styles.countryFilter} activeOpacity={0.8} onPress={openBranchBottomSheet}>
            {selectedBranch ? (
              <MyText style={styles.countryText}>
                {CountryUtil.getCountryFlagEmoji(selectedBranch.countryISO)} {selectedBranch.name}
              </MyText>
            ) : (
              <>
                <MyText style={styles.countryText}>Branch</MyText>
                <Ionicons name="ios-flag-outline" size={14} color="#666" />
              </>
            )}
          </TouchableOpacity>
        </View>
        {!!projects.length && (
          <ProjectListItem key={`header-project_${projects[0].id}`} id={projects[0].id} preloadedData={projects[0]} shouldPlayVideo showProfile />
        )}
      </View>
    ),
    [openBranchBottomSheet, selectedBranch, projects, selectedFilterKey, colorScheme],
  );

  const flatListRenderItem = useCallback(
    ({ item, index }) => (
      <View style={{ backgroundColor: Colors[colorScheme].contentBackground }}>
        <ProjectSearchItem id={item.id} preloadedData={item} showProfile />
      </View>
    ),
    [colorScheme],
  );

  return (
    <FlatList
      ListHeaderComponent={flatListHeaderComponent}
      ListFooterComponent={
        !isEndOfProjects ? null : (
          <MyText style={styles.noItemFoundText}>{!isFetchingProjects && !projects.length ? 'No result found' : 'Yay! You have seen it all!'}</MyText>
        )
      }
      data={projects.slice(1)}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchProjects(false)}
      refreshing={isFetchingProjects}
      onRefresh={() => fetchProjects(true)}
      keyExtractor={(item) => `result-project_${item.id}`}
    />
  );
}

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
    borderBottomColor: 'rgba(160, 160, 160, 0.2)',
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
