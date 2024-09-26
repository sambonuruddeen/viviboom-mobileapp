import { useIsFocused, useNavigation } from '@react-navigation/native';
import { DateTime } from 'luxon';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultProjectPicture from 'rn-viviboom/assets/images/default-project-picture.png';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import ProjectReduxActions from 'rn-viviboom/redux/project/ProjectReduxActions';

const DEFAULT_THUMBNAIL_WIDTH = 256;

const DraftProjectItem = memo(({ item, onPressItem }: { item: Project; index: number; onPressItem: () => void }) => {
  const { thumbnailUri, videos, images, name, description, createdAt } = item;
  const thumbnailSrc = useMemo(() => thumbnailUri || (videos.length > 0 ? videos[0].thumbnailUri : images?.[0]?.uri), [images, thumbnailUri, videos]);

  const dateString = useMemo(() => {
    let res = '-';
    try {
      res = DateTime.fromJSDate(new Date(createdAt)).toLocaleString(DateTime.DATE_MED);
    } catch (err) {
      console.warn(err);
    }
    return res;
  }, [createdAt]);

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPressItem}>
      <View style={styles.mediaContainer}>
        <MyImage
          key={thumbnailSrc}
          uri={thumbnailSrc}
          params={{ width: DEFAULT_THUMBNAIL_WIDTH }}
          style={styles.mediaPreview}
          defaultSource={DefaultProjectPicture}
        />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleContainer}>
          <MyText numberOfLines={1} style={{ fontSize: 18, color: '#fff' }}>
            {name || 'No Title'}
          </MyText>
          <MyText style={{ fontSize: 12, color: '#aaa', marginTop: 4, fontWeight: '400' }} numberOfLines={3}>
            {description}
          </MyText>
        </View>
        <View style={styles.statusContainer}>
          <MyText style={{ fontSize: 12, color: '#aaa' }}>{dateString}</MyText>
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface DraftProjectListProps {
  // ...
}

const DEFAULT_PROJECT_REQUEST_COUNT = 20;

const DraftProjectList = ({}: DraftProjectListProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const account = useReduxStateSelector((s) => s.account);
  const offlineData = useReduxStateSelector((s) => s.project?.[account?.id]?.draftProjects);

  const [projects, setProjects] = useState<Array<Project>>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isEndOfProjects, setIsEndOfProjects] = useState(false);

  useEffect(() => {
    const init = () => {
      setProjects(offlineData || []);
      fetchProjects(true);
    };
    if (isFocus) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocus]);

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
        authorUserId: account?.id,
        isPublished: false,
      };

      try {
        const res = await ProjectApi.getList(requestParams);
        if (hardRefresh) {
          setProjects(res.data.projects);
          ProjectReduxActions.save({ draftProjects: res.data.projects });
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
    [isFetchingProjects, isEndOfProjects, account?.authToken, account?.id, projects],
  );

  const onPressItem = useCallback(
    (preloadedData: Project) => () => {
      navigation.navigate('MediaCarouselScreen', { preloadedData });
    },
    [navigation],
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, react/prop-types
  const renderItem = useCallback((props) => <DraftProjectItem {...props} onPressItem={onPressItem(props.item)} />, [onPressItem]);

  return (
    <FlatList
      ListFooterComponent={!isEndOfProjects ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
      data={projects}
      renderItem={renderItem}
      onEndReached={() => fetchProjects(false)}
      refreshing={isFetchingProjects}
      onRefresh={() => fetchProjects(true)}
      keyExtractor={(item) => `draft-project_${item.id}`}
    />
  );
};

export default DraftProjectList;

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
    color: '#fff',
  },
  itemContainer: {
    flex: 1,
    height: 108,
    // borderWidth: 2,
    // borderColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  mediaContainer: {
    width: 160,
    height: 90,
    borderRadius: 4,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'space-between',
  },
  titleContainer: {
    height: 60,
  },
  statusContainer: {},
});
