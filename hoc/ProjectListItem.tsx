import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Animated, Dimensions, ImageRequireSource, LayoutChangeEvent, Platform, Pressable, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import DefaultProjectPicture from 'rn-viviboom/assets/images/default-project-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import Layout from 'rn-viviboom/constants/Layout';
import { ContentReportType } from 'rn-viviboom/enums/ContentReportType';
import { ProjectBadgeStatusType } from 'rn-viviboom/enums/ProjectBadgeStatusType';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import ProjectReduxActions from 'rn-viviboom/redux/project/ProjectReduxActions';

import MyImage from './MyImage';
import MyText from './MyText';
import MyVideo from './MyVideo';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DefaultProjectPictureTyped = DefaultProjectPicture as ImageRequireSource;

const DEFAULT_PROJECT_ITEM_IMAGE_WIDTH = Layout.screen.width > 600 ? 1024 : 512;
const DEFAULT_PROFILE_IMAGE_SIZE = 128;

const screen = Dimensions.get('screen');
const projectImagePadding = screen.width < 600 ? 12 : 18;
const mediaWidth = screen.width - 2 * projectImagePadding;
const videoHeight = (mediaWidth * 9) / 16;
const projectImageHeight = (mediaWidth * 3) / 4;

interface IProps {
  id?: number;
  preloadedData: Project;
  showProfile?: boolean;
  shouldPlayVideo?: boolean;
}

const ProjectListItem = memo(({ id, preloadedData, showProfile, shouldPlayVideo }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const account = useReduxStateSelector((s) => s?.account);
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shrinkAnim = useRef(new Animated.Value(0)).current;
  const [itemHeight, setItemHeight] = useState(0);
  // for hide blocked project item
  const [isHidden, setHidden] = useState(false);

  const [loading, setLoading] = useState(false);

  const [project, setProject] = useState<Project>(preloadedData);

  const [isUserLiked, setUserLiked] = useState<boolean>(!!project.likes?.find((l) => l.userId === account?.id));
  const [isLikeLoading, setLikeLoading] = useState(false);

  const authorName = useMemo(() => {
    if (project?.authorUsers?.length < 2) {
      return `${project?.authorUsers?.[0]?.name || ''}`;
    }
    if (project?.authorUsers?.length === 2) {
      return t('authors', { name1: project?.authorUsers?.[0]?.name, name2: project?.authorUsers?.[1]?.name });
    }
    return t('authorOthers', { name: project?.authorUsers?.[0]?.name });
  }, [project?.authorUsers, t]);

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

  const onLikePress = async () => {
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
  };

  const onClickMore = () => {
    showActionSheetWithOptions(
      {
        options: ['Share', 'Block', 'Report', 'Cancel'],
        destructiveButtonIndex: 2,
        cancelButtonIndex: 3,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          try {
            const projectUrl = `${Config.MobileAppUrl}/project/${project?.id}`;
            const message = `Check out ${project.name} by ${authorName} on VIVIBOOM`;
            const result = await Share.share({
              message: Platform.OS === 'ios' ? message : projectUrl,
              url: projectUrl,
              title: message,
            });
            if (result.action === Share.sharedAction) {
              Toast.show({ text1: 'Yay! Project shared successfully', type: 'success' });
            }
          } catch (error) {
            Toast.show({ text1: error?.message, type: 'error' });
          }
        } else if (buttonIndex === 1) {
          // block via redux
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
          }).start(() => {
            setHidden(true);
            ProjectReduxActions.blockProject(project?.id);
            Toast.show({ text1: 'The content is now hidden.', type: 'success' });
            Animated.timing(shrinkAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }).start();
          });
        } else if (buttonIndex === 2) {
          // report
          navigation.navigate('ReportModalScreen', { relevantId: project?.id, relevantType: ContentReportType.PROJECT });
        }
      },
    );
  };

  // to get the height of the item
  const onContentLayout = (e: LayoutChangeEvent) => {
    const value = e.nativeEvent.layout.height;
    if (itemHeight < value) setItemHeight(value);
  };

  const videoDefaultImageUri = useMemo(() => {
    const imageUrl = project.thumbnailUri || project.images?.[0]?.uri;
    if (imageUrl?.endsWith('animated-image')) {
      // display picture instead of gif to optimize performance (change of backend media endpoint)
      return imageUrl.replace('animated-image', 'thumbnail');
    }
    return imageUrl;
  }, [project.images, project.thumbnailUri]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.push('ProjectScreen', { preloadedData: project })}
      activeOpacity={1}
      onLayout={onContentLayout}
    >
      {isHidden ? (
        <Animated.View style={{ height: shrinkAnim.interpolate({ inputRange: [0, 1], outputRange: [itemHeight, 0] }) }} />
      ) : (
        <Animated.View style={{ opacity: fadeAnim, paddingVertical: 16 }}>
          {showProfile && (
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={styles.profileContainer} onPress={() => navigation.push('MemberScreen', { preloadedData: project?.authorUsers?.[0] })}>
                <View style={styles.avatarContainer}>
                  {project?.authorUsers?.length < 2 ? (
                    <MyImage
                      style={styles.avatar}
                      uri={project?.authorUsers?.[0]?.profileImageUri}
                      defaultSource={DefaultProfilePictureTyped}
                      params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                    />
                  ) : (
                    <>
                      <MyImage
                        style={[styles.secondAvatar, { borderColor: Colors[colorScheme].background }]}
                        uri={project?.authorUsers?.[1]?.profileImageUri}
                        defaultSource={DefaultProfilePictureTyped}
                        params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                      />
                      <MyImage
                        style={[styles.firstAvatar, { borderColor: Colors[colorScheme].background }]}
                        uri={project?.authorUsers?.[0]?.profileImageUri}
                        defaultSource={DefaultProfilePictureTyped}
                        params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                      />
                    </>
                  )}
                </View>
                <View style={styles.authorContainer}>
                  <TouchableOpacity onPress={() => navigation.push('MemberScreen', { preloadedData: project?.authorUsers?.[0] })} activeOpacity={0.8}>
                    <MyText style={styles.nameText}>{project?.authorUsers?.[0]?.name}</MyText>
                  </TouchableOpacity>
                  {project?.authorUsers?.length > 1 && (
                    <>
                      <MyText style={styles.text}>and</MyText>
                      <TouchableOpacity
                        onPress={() => {
                          if (project?.authorUsers?.length === 2) navigation.push('MemberScreen', { preloadedData: project?.authorUsers?.[1] });
                          else navigation.push('ProjectScreen', { preloadedData: project });
                        }}
                        activeOpacity={0.8}
                      >
                        <MyText style={styles.nameText}>{project?.authorUsers?.length > 2 ? 'others' : project?.authorUsers?.[1]?.name}</MyText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </Pressable>
              <View style={styles.flex} />
            </View>
          )}
          <View style={styles.imageContainer}>
            {project?.videos?.length > 0 && (
              <MyVideo
                src={project?.videos?.[0].uri}
                params={{ width: `${DEFAULT_PROJECT_ITEM_IMAGE_WIDTH}` }}
                shouldPlay={shouldPlayVideo}
                shouldMount={shouldPlayVideo}
                width={mediaWidth}
                height={videoHeight}
                preloadImageUri={videoDefaultImageUri}
              />
            )}
            {!project?.videos?.length && (
              <MyImage
                style={styles.projectImage}
                uri={project.thumbnailUri || project.images?.[0]?.uri}
                params={{ width: DEFAULT_PROJECT_ITEM_IMAGE_WIDTH }}
                defaultSource={DefaultProjectPictureTyped}
              />
            )}
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
                      <MaterialCommunityIcons name="medal-outline" size={16} color="#666" style={{ marginRight: 6 }} />
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
            <View style={styles.likeContainer}>
              <TouchableOpacity onPress={onLikePress} style={styles.likeButton}>
                {isLikeLoading ? (
                  <ActivityIndicator size={14} />
                ) : (
                  <Ionicons name={isUserLiked ? 'ios-heart' : 'ios-heart-outline'} size={24} color="rgb(248,48,95)" />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreButton} onPress={onClickMore}>
                <Ionicons name="ios-ellipsis-vertical" size={20} color="#aaa" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
});

export default ProjectListItem;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    margin: 0,
    paddingHorizontal: projectImagePadding,
  },
  profileContainer: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 50, height: 50 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#000' },
  firstAvatar: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: '#000',
    left: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondAvatar: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 25,
    backgroundColor: '#000',
    top: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#fff',
  },
  authorContainer: { marginLeft: 12, flexDirection: 'row' },
  text: { marginRight: 4, fontSize: 18, color: '#a2a2a2', fontWeight: '400' },
  nameText: { marginRight: 4, fontSize: 18, color: '#a2a2a2' },
  imageContainer: { flex: 0, marginVertical: 12, backgroundColor: '#ecf0f1', borderRadius: 12 },
  projectImage: { height: projectImageHeight, borderRadius: 12, width: '100%' },
  videoDefaultImage: { borderRadius: 12, width: mediaWidth, height: videoHeight },
  statusAndLikeContainer: { flexDirection: 'row', alignItems: 'center' },
  statusContainer: { width: '80%' },
  likeContainer: { width: '20%', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-end', height: '95%' },
  projectNameText: { fontSize: 18 },
  descriptionContainer: { display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', height: 44 },
  projectDescriptionText: { fontSize: 15, color: '#a2a2a2', width: '100%' },

  statusText: { fontSize: 15, fontWeight: '400', color: '#a2a2a2', alignSelf: 'center' },
  likeButton: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: 28, height: 28 },
  moreButton: { marginTop: 2, marginLeft: 10 },
});
