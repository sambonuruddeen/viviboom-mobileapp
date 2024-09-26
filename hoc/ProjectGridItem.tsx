import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Dimensions, ImageRequireSource, Platform, Pressable, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import DefaultProjectPicture from 'rn-viviboom/assets/images/default-project-picture.png';
import Layout from 'rn-viviboom/constants/Layout';
import { ProjectBadgeStatusType } from 'rn-viviboom/enums/ProjectBadgeStatusType';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyImage from './MyImage';
import MyText from './MyText';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DefaultProjectPictureTyped = DefaultProjectPicture as ImageRequireSource;

const DEFAULT_PROJECT_ITEM_IMAGE_WIDTH = Layout.screen.width > 600 ? 512 : 256;
const DEFAULT_PROFILE_IMAGE_SIZE = 64;

const screen = Dimensions.get('screen');
const aspectRatio = 4 / 3;

interface IProps {
  id?: number;
  preloadedData: Project;
  showProfile?: boolean;
  showLike?: boolean;
  style?: StyleProp<ViewStyle>;
  isProjectScreen?: boolean;
}

const ProjectGridItem = memo(({ id, preloadedData, showProfile, style, isProjectScreen }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);

  const [project, setProject] = useState<Project>(preloadedData);

  const [isUserLiked, setUserLiked] = useState<boolean>(!!project.likes?.find((l) => l.userId === account?.id));
  const [isLikeLoading, setLikeLoading] = useState(false);

  // API calls
  const fetchProject = useCallback(async () => {
    if ((project?.authorUsers !== undefined && project?.likes !== undefined && project?.images !== undefined && project?.badges !== undefined) || !id) {
      return;
    }
    setLoading(true);
    try {
      const res = await ProjectApi.get({
        authToken: account?.authToken,
        projectId: id,
        verboseAttributes: ['badges'],
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

  const onLikePress = useCallback(async () => {
    setLikeLoading(true);
    try {
      const res = await ProjectApi.like({
        authToken: account?.authToken,
        projectId: project?.id,
        isLike: !isUserLiked,
      });
      setUserLiked(res.data?.isLike);
    } catch (err) {
      console.error(err);
    }
    setLikeLoading(false);
  }, [account?.authToken, isUserLiked, project?.id]);

  const onNavigate = () => {
    if (isProjectScreen) navigation.navigate('ProjectScreen', { preloadedData: project });
    else navigation.push('ProjectScreen', { preloadedData: project });
  };

  // -1 is to account for border
  const imageWidth = useMemo(() => +(StyleSheet.flatten(style)?.width || screen.width) - 1, [style]);
  const imageHeight = useMemo(() => imageWidth / aspectRatio, [imageWidth]);

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
    <Pressable style={[styles.container, style]} onPress={onNavigate}>
      <View style={styles.imageContainer}>
        <MyImage
          style={[styles.projectImage, { width: imageWidth, height: imageHeight }]}
          uri={project.thumbnailUri || project.images?.[0]?.uri}
          params={{ width: DEFAULT_PROJECT_ITEM_IMAGE_WIDTH }}
          defaultSource={DefaultProjectPictureTyped}
        />
      </View>
      <View style={styles.statusAndLikeContainer}>
        <View style={styles.statusContainer}>
          <MyText style={styles.projectNameText} numberOfLines={1}>
            {project?.name}
          </MyText>
          <View style={styles.descriptionContainer}>
            {project.description ? (
              <MyText style={styles.projectDescriptionText} numberOfLines={2}>
                {project?.description}
              </MyText>
            ) : null}
            {!project.description &&
              project?.isCompleted &&
              project?.badges?.length > 0 &&
              project?.badgeStatus !== ProjectBadgeStatusType.UNSUBMITTED &&
              project?.badgeStatus !== ProjectBadgeStatusType.REJECTED && (
                <>
                  <MaterialCommunityIcons name="medal-outline" size={14} style={{ marginTop: Platform.OS === 'android' ? 4 : 0, color: '#333' }} />
                  {project?.badgeStatus === ProjectBadgeStatusType.AWARDED && (
                    <MyText style={styles.statusText}>{t('wins', { count: project?.badges?.length })}</MyText>
                  )}
                  {[ProjectBadgeStatusType.SUBMITTED, ProjectBadgeStatusType.RESUBMITTED].includes(project?.badgeStatus) && (
                    <MyText style={styles.statusText}>{t('submitted', { count: project?.badges?.length })}</MyText>
                  )}
                </>
            )}
            {!project.description && !project?.isCompleted && (
              <>
                <Ionicons size={10} name="ios-settings-outline" style={{ marginTop: Platform.OS === 'android' ? 4 : 0, color: '#333' }} />
                <MyText style={styles.statusText}>{t('Work-In-Progress')}</MyText>
              </>
            )}
          </View>
        </View>
        {showProfile && (
          <View style={styles.authorContainer}>
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
            <TouchableOpacity onPress={onLikePress} style={styles.likeButton}>
              {isLikeLoading ? (
                <ActivityIndicator size={14} />
              ) : (
                <Ionicons name={isUserLiked ? 'ios-heart' : 'ios-heart-outline'} size={18} color="rgb(248,48,95)" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Pressable>
  );
});

export default ProjectGridItem;

const styles = StyleSheet.create({
  container: {
    margin: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.5)',
    borderRadius: 8,
  },
  imageContainer: { flex: 0 },
  projectImage: { borderTopRightRadius: 8, borderTopLeftRadius: 8 },

  statusAndLikeContainer: {},
  statusContainer: { width: '100%', paddingTop: 8, paddingHorizontal: 8 },
  authorContainer: { width: '100%', paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  projectNameText: { fontSize: 15, fontWeight: '400' },
  descriptionContainer: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', marginTop: 8, height: 36 },
  projectDescriptionText: { fontSize: 13, color: '#aaa', width: '100%', fontWeight: '400' },

  statusText: { fontSize: 13, fontWeight: '400', marginLeft: 4, color: '#aaa' },
  likeButton: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: 20, height: 20 },
  moreButton: { marginTop: 2, marginHorizontal: 10 },

  profileContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 20, height: 20, borderRadius: 10 },
  nameText: { flex: 1, marginLeft: 4, fontSize: 12, color: '#a2a2a2', marginTop: 2 },
});
