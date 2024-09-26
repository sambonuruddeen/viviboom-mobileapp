import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, ImageRequireSource, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { ProjectBadgeStatusType } from 'rn-viviboom/enums/ProjectBadgeStatusType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import OnboardingReduxActions from 'rn-viviboom/redux/onboarding/OnboardingReduxActions';

import AddCommentView from './AddCommentView';
import AuthorBanner from './AuthorBanner';
import AuthorBottomSheet from './AuthorBottomSheet';
import CommentBottomSheet from './CommentBottomSheet';
import ProjectCommentPreview from './ProjectCommentPreview';
import ProjectFooter from './ProjectFooter';
import ProjectHeader from './ProjectHeader';
import ProjectMediaCarousel from './ProjectMediaCarousel';
import ProjectSection from './ProjectSection';
import RecommendedProjects from './RecommendedProjects';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;

const badgeImageParams = { width: 128, suffix: 'png' };

const screen = Dimensions.get('screen');
const footerHeight = 40;
const modalWidth = Math.min(Layout.screen.width - 2 * 18, 500);

export default function ProjectScreen({ navigation, route }: RootStackScreenProps<'ProjectScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();

  const { preloadedData, showCommentSection } = route.params;
  const user = useReduxStateSelector((state) => state.account);
  const onboarding = useReduxStateSelector((state) => state.onboarding);
  const scrollRef = useRef<ScrollView>();
  const insets = useSafeAreaInsets();
  const offset = useRef(new Animated.Value(0)).current;

  const [carouselHeight, setCarouselHeight] = useState(0);
  const [authorOffset, setAuthorOffset] = useState(0);

  const [isProjectLoading, setProjectLoading] = useState(true);
  const [project, setProject] = useState(preloadedData);

  // project badges
  const [projectBadges, setProjectBadges] = useState<Badge[]>([]);

  // project section
  const [isProjectSectionLoading, setProjectSectionLoading] = useState(true);
  const [projectSections, setProjectSections] = useState<ProjectSection[]>([]);

  // comment
  const [showAddCommentView, setShowAddCommentView] = useState(false);
  const [showCommentBottomSheet, setShowCommentBottomSheet] = useState(false);
  const [shouldCommentReload, setShouldCommentReload] = useState(false);

  const [showCommentWarningModal, setShowCommentWarningModal] = useState(false);

  // project authors
  const [showAuthorBottomSheet, setShowAuthorBottomSheet] = useState(false);

  const authorName = useMemo(() => {
    if (project?.authorUsers?.length < 2) {
      return `${project?.authorUsers?.[0]?.name || ''}`;
    }
    if (project?.authorUsers?.length === 2) {
      return t('authors', { name1: project?.authorUsers?.[0]?.name, name2: project?.authorUsers?.[1]?.name });
    }
    return t('authorOthers', { name: project?.authorUsers?.[0]?.name });
  }, [project?.authorUsers, t]);

  const onBackPressed = () => {
    navigation.pop();
  };

  const onAddCommentPressed = () => {
    if (!onboarding.projectComment) {
      setShowCommentWarningModal(true);
    } else {
      setShowAddCommentView(true);
    }
  };

  const onShowCommentBottomSheet = () => {
    if (!onboarding.projectComment) setShowCommentWarningModal(true);
    setShowCommentBottomSheet(true);
  };

  const handleCommentWarningModalClose = () => {
    OnboardingReduxActions.save({ projectComment: true });
    setShowCommentWarningModal(false);
    if (!showCommentBottomSheet) setShowAddCommentView(true);
  };

  // API calls
  const fetchProject = useCallback(async () => {
    setProjectLoading(true);
    try {
      const res = await ProjectApi.get({ authToken: user?.authToken, projectId: preloadedData?.id, verboseAttributes: ['files', 'categories', 'badges'] });
      setProject(res.data?.project);

      const fetchedProject = res.data?.project;

      if (fetchedProject.badgeStatus === ProjectBadgeStatusType.AWARDED) setProjectBadges(fetchedProject.badges);
      if (showCommentSection) setShowCommentBottomSheet(true);
    } catch (err) {
      console.log(err);
    }
    setProjectLoading(false);
  }, [preloadedData?.id, showCommentSection, user?.authToken]);

  const fetchProjectSections = useCallback(async () => {
    if (!project?.id) return;
    setProjectSectionLoading(true);
    try {
      const res = await ProjectApi.getSections({ authToken: user?.authToken, projectId: project?.id });
      setProjectSections(res.data?.projectSections);
    } catch (err) {
      console.log(err);
    }
    setProjectSectionLoading(false);
  }, [project?.id, user?.authToken]);

  const reloadComment = () => {
    setShouldCommentReload(true);
    setShouldCommentReload(false);
  };

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    fetchProjectSections();
  }, [fetchProjectSections]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0 });
  }, [project?.id]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: footerHeight + insets.bottom + Layout.bottomNavigatorBarHeight }]}
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], { useNativeDriver: false })}
        overScrollMode="never"
      >
        <ProjectMediaCarousel project={project} isProjectLoading={isProjectLoading} key={`media-carousel_${project?.id}`} />
        <View style={styles.projectTitle} onLayout={(e) => setCarouselHeight(e.nativeEvent.layout.y)}>
          <MyText style={styles.titleText}>{project?.name}</MyText>
        </View>
        <View style={styles.projectDescription}>
          <View style={styles.descriptionTextContainer}>
            <MyText style={{ ...styles.descriptionText, color: Colors[colorScheme].textSecondary }}>
              {t('Created By')}: {authorName}
            </MyText>
          </View>
          <View style={styles.descriptionTextContainer}>
            <MyText style={{ ...styles.descriptionText, color: Colors[colorScheme].textSecondary }}>
              {t('Inspired By')}: {project?.description || '-'}
            </MyText>
          </View>
        </View>
        {!!projectBadges.length && (
          <Pressable style={styles.projectBadges}>
            <View style={styles.badgeImages}>
              {projectBadges?.slice(0, 5)?.map((badge) => (
                <TouchableOpacity
                  key={`project_${project?.id}-badge_${badge?.id}`}
                  style={styles.badgeImageContainer}
                  onPress={() => navigation.push('BadgeScreen', { preloadedData: badge })}
                >
                  <MyImage
                    uri={badge?.imageUri}
                    defaultSource={DefaultProfilePictureTyped}
                    params={badgeImageParams}
                    style={styles.badgeImage}
                    imageFormat="png"
                  />
                </TouchableOpacity>
              ))}
              {!!projectBadges?.length && projectBadges.length > 5 && (
                <View style={styles.additionalBadge}>
                  <MyText style={{ ...styles.additionalBadgePlus, color: Colors[colorScheme].textSecondary }}>+</MyText>
                  <MyText style={{ ...styles.additionalBadgeText, color: Colors[colorScheme].textSecondary }}>{projectBadges.length - 5}</MyText>
                </View>
              )}
            </View>
            <MyText style={styles.badgeAwardedText}>{t('Badges Awarded')}</MyText>
          </Pressable>
        )}
        <View style={styles.workInProgress}>
          {!project?.isCompleted && (
            <>
              <Ionicons name="ios-settings-outline" size={18} color={Colors[colorScheme].text} />
              <MyText style={styles.workInProgressText}>{t('Work-In-Progress')}</MyText>
            </>
          )}
        </View>
        <View style={styles.projectContent} onLayout={(e) => setAuthorOffset(e.nativeEvent.layout.y)}>
          <View style={styles.authorBanner}>
            <AuthorBanner project={project} key={`project-author_${project?.id}`} onAuthorPressed={() => setShowAuthorBottomSheet(true)} />
          </View>
          <ProjectSection project={project} projectSection={project} isRootProject />
          {projectSections.map((v) => (
            <ProjectSection key={`project-section_${v.id}`} project={project} projectSection={v} />
          ))}
        </View>
        <View style={styles.projectComments}>
          <MyText style={styles.commentsTitle}>Comments for this project</MyText>
          <ProjectCommentPreview
            projectId={project?.id}
            onPressAdd={onAddCommentPressed}
            onPressShowAll={onShowCommentBottomSheet}
            shouldReload={shouldCommentReload}
          />
        </View>
        <RecommendedProjects key={`recommended-project-for_${project?.id}`} />
      </ScrollView>
      <ProjectHeader
        project={project}
        onBackPressed={onBackPressed}
        onAuthorPressed={() => setShowAuthorBottomSheet(true)}
        animatedOffset={offset}
        carouselHeight={carouselHeight}
        authorOffset={authorOffset}
      />
      <ProjectFooter project={project} onShowAddCommentView={onAddCommentPressed} onShowCommentBottomSheet={onShowCommentBottomSheet} />
      <AddCommentView
        show={showAddCommentView}
        handleClose={() => setShowAddCommentView(false)}
        focusOnShow
        projectId={project?.id}
        reloadData={reloadComment}
      />
      <CommentBottomSheet
        show={showCommentBottomSheet}
        handleClose={() => setShowCommentBottomSheet(false)}
        projectId={project?.id}
        reloadData={reloadComment}
      />
      <AuthorBottomSheet show={showAuthorBottomSheet} handleClose={() => setShowAuthorBottomSheet(false)} project={project} />
      <Modal visible={showCommentWarningModal} hardwareAccelerated animationType="fade" onRequestClose={() => setShowCommentWarningModal(false)} transparent>
        <View style={styles.centeredView}>
          <View style={[styles.modalContentContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
            <MyText style={styles.modalTitle}>{t('Before you comment...')}</MyText>
            <MyText style={styles.modalText}>{t('commentWarning')}</MyText>
            <MyButton style={styles.confirmButton} onPress={handleCommentWarningModalClose} mode="outlined">
              {t('I understand!')}
            </MyButton>
          </View>
        </View>
      </Modal>
      {isProjectLoading && <View style={[styles.hideAll, { backgroundColor: Colors[colorScheme].background }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  projectMedia: {},
  mediaItem: {
    width: screen.width,
    maxHeight: (3 / 4) * screen.height,
  },
  projectTitle: {
    marginHorizontal: 28,
    paddingTop: 28,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  projectDescription: {
    marginHorizontal: 28,
    marginTop: 12,
    alignItems: 'center',
  },
  descriptionTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  descriptionText: {
    fontWeight: '400',
    textAlign: 'center',
  },
  projectBadges: {
    width: '100%',
    height: 80,
    marginVertical: 12,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  badgeImages: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeImageContainer: {
    width: 44,
    height: 46,
    margin: 3,
    shadowColor: '#171717',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
  },
  badgeImage: {
    borderRadius: 12,
    width: 40,
    height: 46,
  },
  additionalBadge: {
    width: 44,
    height: 44,
    borderRadius: 23,
    margin: 3,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    shadowColor: '#171717',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
  },
  additionalBadgePlus: {
    fontSize: 18,
    fontWeight: '400',
  },
  additionalBadgeText: {
    fontSize: 20,
    fontWeight: '400',
  },
  badgeAwardedText: {
    margin: 6,
  },
  workInProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
  },
  workInProgressText: {
    marginHorizontal: 6,
  },
  projectContent: {
    width: '100%',
    paddingHorizontal: 18,
  },
  authorBanner: {
    width: '100%',
  },
  lastUpdated: {
    fontSize: 10,
    fontWeight: '400',
    color: '#666',
    marginVertical: 18,
  },
  projectComments: {
    width: '100%',
    paddingHorizontal: 18,
    flex: 1,
  },
  commentsTitle: {
    fontSize: 16,
    marginTop: 18,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: modalWidth,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 18,
  },
  modalText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 18,
    textAlign: 'center',
  },
  confirmButton: {
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 0,
  },
  hideAll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
