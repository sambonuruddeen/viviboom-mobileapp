import { ComponentType, JSXElementConstructor, ReactElement, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import MyText from 'rn-viviboom/hoc/MyText';
import ProjectListItem from 'rn-viviboom/hoc/ProjectListItem';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import ProjectReduxActions from 'rn-viviboom/redux/project/ProjectReduxActions';
import ArrayUtil from 'rn-viviboom/utils/ArrayUtil';

interface ProjectListProps {
  tabKey: string;
  isShowing: boolean;
  ListHeaderComponent?: ComponentType<any> | ReactElement<any, string | JSXElementConstructor<any>>;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

const DEFAULT_PROJECT_REQUEST_COUNT = 20;

export type ProjectListRefreshHandle = {
  refresh: () => void;
};

const ProjectList = forwardRef<ProjectListRefreshHandle, ProjectListProps>(({ tabKey, isShowing, ListHeaderComponent, onScrollDown, onScrollUp }, ref) => {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const account = useReduxStateSelector((s) => s.account);
  const offlineData = useReduxStateSelector((s) => {
    switch (tabKey) {
      case 'Home':
        return s.project?.[account?.id]?.homeProjects;
      default:
        return [];
    }
  });
  const blockedProjectIds = useReduxStateSelector((s) => s.project?.[account?.id]?.blockedProjectIds || []);

  const [projects, setProjects] = useState<Array<Project>>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isEndOfProjects, setIsEndOfProjects] = useState(false);

  // current project in view, for auto video playing
  const [currentProject, setCurrentProject] = useState(0);
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 95, minimumViewTime: 500 });

  const [isTouching, setTouching] = useState(false);
  const scrollOffset = useRef(0);

  useEffect(() => {
    const init = () => {
      setProjects(offlineData || []);
      fetchProjects(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingProjects) return;
      if (!hardRefresh && isEndOfProjects) return;
      setIsFetchingProjects(true);

      const requestParams = {
        authToken: account?.authToken,
        limit: DEFAULT_PROJECT_REQUEST_COUNT,
        offset: hardRefresh ? 0 : projects.length,
        order: ProjectOrderType.LATEST,
        verboseAttributes: ['badges'],
        isCompleted: undefined,
      };

      if (tabKey === 'Completed') requestParams.isCompleted = true;
      if (tabKey === 'WIP') requestParams.isCompleted = false;

      try {
        const res = await ProjectApi.getList(requestParams);
        let newProjects = res.data.projects.filter((p) => !blockedProjectIds.find((id) => id === p.id));
        if (hardRefresh) {
          if (tabKey === 'Home') {
            newProjects = ArrayUtil.shuffle(newProjects);
            ProjectReduxActions.save({ homeProjects: newProjects });
          }
          setProjects(newProjects);
        } else {
          setProjects([...projects, ...newProjects]);
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
    [isFetchingProjects, isEndOfProjects, account?.authToken, projects, tabKey, blockedProjectIds],
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentProject(viewableItems[0].index);
    }
  }, []);

  const flatListRenderItem = ({ item, index }) => <ProjectListItem preloadedData={item} shouldPlayVideo={isShowing && index === currentProject} showProfile />;

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await fetchProjects(true);
    },
  }));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 51 is the a threshold to prevent accidentally scroll down;
    if (!isFetchingProjects && isTouching) {
      if (event.nativeEvent.contentOffset.y > scrollOffset.current + 18) {
        onScrollDown();
      } else if (event.nativeEvent.contentOffset.y < scrollOffset.current - 18) {
        onScrollUp();
      }
    }
    scrollOffset.current = event.nativeEvent.contentOffset.y;
  };

  return (
    <FlatList
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={!isEndOfProjects ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={projects}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchProjects(false)}
      refreshing={isFetchingProjects}
      onRefresh={() => fetchProjects(true)}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewConfigRef.current}
      keyExtractor={(item) => item.key || item.id}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onTouchStart={() => setTouching(true)}
      onTouchEnd={() => setTouching(false)}
    />
  );
});

export default ProjectList;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
});
