import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ImageRequireSource, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import DefaultProjectPicture from 'rn-viviboom/assets/images/default-project-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import { ProjectBadgeStatusType } from 'rn-viviboom/enums/ProjectBadgeStatusType';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyImage from './MyImage';
import MyText from './MyText';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DefaultProjectPictureTyped = DefaultProjectPicture as ImageRequireSource;

const DEFAULT_PROJECT_ITEM_IMAGE_WIDTH = 256;
const DEFAULT_PROFILE_IMAGE_SIZE = 128;

interface IProps {
  id?: number;
  preloadedData: Project;
  showProfile?: boolean;
}

const ProjectSearchItem = memo(({ id, preloadedData, showProfile }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [project, setProject] = useState<Project>(preloadedData);

  // API calls
  const fetchProject = useCallback(async () => {
    if ((project?.authorUsers !== undefined && project?.categories !== undefined && project?.images !== undefined && project?.badges !== undefined) || !id) {
      return;
    }
    setLoading(true);
    try {
      const res = await ProjectApi.get({
        authToken: account?.authToken,
        projectId: id,
        verboseAttributes: ['badges', 'categories'],
      });
      setProject(res.data?.project);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [id, account, project]);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const projectTags = useMemo(() => {
    const tagSet = new Set([...(project?.categories?.map((pc) => pc.name.trim()) || []), ...(project?.badges?.map((b) => b.name.trim()) || [])]);
    const strs = [...tagSet];
    strs.sort((a, b) => b.length - a.length);
    // if only 1 or less tags present, just return it
    if (strs.length < 2) return strs;
    // if more than 1 tag found, make sure it does not take too much space
    if (strs[0].length > 15) return [strs[0]];
    return strs.slice(-2);
  }, [project]);

  const authorName = useMemo(() => {
    if (project?.authorUsers?.length < 2) {
      return `${project?.authorUsers?.[0]?.name || ''}`;
    }
    if (project?.authorUsers?.length === 2) {
      return t('authors', { name1: project?.authorUsers?.[0]?.name, name2: project?.authorUsers?.[1]?.name });
    }
    return t('authorOthers', { name: project?.authorUsers?.[0]?.name });
  }, [project?.authorUsers, t]);

  return (
    <Pressable style={styles.container} onPress={() => navigation.navigate('ProjectScreen', { preloadedData: project })}>
      <View style={styles.imageContainer}>
        <MyImage
          style={styles.projectImage}
          uri={project.thumbnailUri || project.images?.[0]?.uri}
          params={{ width: DEFAULT_PROJECT_ITEM_IMAGE_WIDTH }}
          defaultSource={DefaultProjectPictureTyped}
        />
      </View>
      <View style={styles.statusContainer}>
        <View style={styles.statusTop}>
          <MyText style={styles.projectNameText} numberOfLines={1}>
            {project?.name}
          </MyText>
          <View style={styles.descriptionContainer}>
            {project.description ? (
              <MyText style={styles.projectDescriptionText} numberOfLines={1}>
                {project?.description}
              </MyText>
            ) : null}
            {!project.description &&
              project?.isCompleted &&
              project?.badges?.length > 0 &&
              project?.badgeStatus !== ProjectBadgeStatusType.UNSUBMITTED &&
              project?.badgeStatus !== ProjectBadgeStatusType.REJECTED && (
                <>
                  <MaterialCommunityIcons name="medal-outline" size={14} color="#aaa" />
                  {project?.badgeStatus === ProjectBadgeStatusType.AWARDED && (
                    <MyText style={styles.statusText}>{t('wins', { count: project?.badges?.length })}</MyText>
                  )}
                  {[ProjectBadgeStatusType.SUBMITTED, ProjectBadgeStatusType.RESUBMITTED].includes(project?.badgeStatus) && (
                    <MyText style={styles.statusText}>{t('submitted', { count: project?.badges?.length })}</MyText>
                  )}
                </>
            )}
            {!project.description && !project?.isCompleted && <MyText style={styles.statusText}>{t('Work-In-Progress')}</MyText>}
          </View>
        </View>
        <View style={styles.tags}>
          {projectTags.map((tag) => (
            <View key={tag} style={[styles.projectTag, { backgroundColor: Colors[colorScheme].textInput }]}>
              <MyText style={styles.tagText} numberOfLines={1}>
                {tag}
              </MyText>
            </View>
          ))}
        </View>
        {showProfile && (
          <View style={styles.profileContainer}>
            <MyImage
              style={styles.avatar}
              uri={project?.authorUsers?.[0]?.profileImageUri}
              defaultSource={DefaultProfilePictureTyped}
              params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
            />
            <MyText style={styles.nameText} numberOfLines={1}>
              {authorName}
            </MyText>
          </View>
        )}
      </View>
    </Pressable>
  );
});

export default ProjectSearchItem;

const styles = StyleSheet.create({
  container: {
    margin: 0,
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  imageContainer: {},
  projectImage: {
    borderRadius: 12,
    height: 126,
    width: 168,
  },
  statusContainer: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  statusTop: {},
  projectNameText: {
    fontSize: 15,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  projectDescriptionText: {
    fontSize: 15,
    color: '#aaa',
    width: '100%',
    fontWeight: '400',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '400',
    marginLeft: 6,
    color: '#aaa',
    alignSelf: 'center',
  },
  tags: {
    flexDirection: 'row',
  },
  tagText: {
    fontWeight: '400',
    fontSize: 12,
  },
  projectTag: {
    height: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    marginRight: 6,
  },
  profileContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  nameText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#aaa',
    fontWeight: '400',
  },
});
