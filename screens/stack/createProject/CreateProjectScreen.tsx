import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, ProgressBar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import DefaultProjectPicture from 'rn-viviboom/assets/images/default-project-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import MyTooltip from 'rn-viviboom/hoc/MyTooltip';
import OverlayLoader from 'rn-viviboom/hoc/OverlayLoader';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';
import OnboardingReduxActions from 'rn-viviboom/redux/onboarding/OnboardingReduxActions';

import CategoryBottomSheet from './CategoryBottomSheet';
import CollaboratorBottomSheet from './CollaboratorBottomSheet';
import ContentBottomSheet from './ContentBottomSheet';
import CreateProjectHeader from './CreateProjectHeader';
import FileBottomSheet from './FileBottomSheet';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DefaultProjectPictureTyped = DefaultProjectPicture as ImageRequireSource;

const DEFAULT_PROFILE_IMAGE_SIZE = 128;
const badgeImageParams = { width: 128, suffix: 'png' };
const challengeImageParams = { width: 128 };
const thumbnailPreviewParams = { width: 256 };

export default function CreateProjectScreen({ navigation, route }: RootStackScreenProps<'CreateProjectScreen'>) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const id = useReduxStateSelector((s) => s.createProject.id);
  const onboarding = useReduxStateSelector((state) => state.onboarding);

  const [showHint, setShowHint] = useState<string>();

  const [showContentBottomSheet, setShowContentBottomSheet] = useState(false);
  const [showCategoryBottomSheet, setShowCategoryBottomSheet] = useState(false);
  const [showFileBottomSheet, setShowFileBottomSheet] = useState(false);
  const [showAuthorBottomSheet, setShowAuthorBottomSheet] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<User>(null);

  const [isProjectSaving, setProjectSaving] = useState(false);
  const [isProjectPublishing, setProjectPublishing] = useState(false);

  const [isMediaSaved, setMediaSaved] = useState(false);
  const [numberOfMediaSaved, setNumberOfMediaSaved] = useState(0);
  const [numberOfMediaToSave, setNumberOfMediaToSave] = useState(0);

  // data
  const { videos, images, isSavingMedia, authorUserId, name, description, thumbnailUri, isCompleted, content, files, badges, projectCategories, authorUsers } =
    useReduxStateSelector((state) => state.createProject);

  // use local states to bind text inputs to improve performance
  const [nameText, setNameText] = useState(name);
  const [descriptionText, setDescriptionText] = useState(description);

  const onProgressChange = useCallback((savedCount: number, totalCount: number) => {
    setNumberOfMediaSaved(savedCount);
    setNumberOfMediaToSave(totalCount);
  }, []);

  const onBackPressed = () => {
    // sync text to redux
    CreateProjectReduxActions.setProject({ name: nameText, description: descriptionText });
    navigation.navigate('MediaCarouselScreen');
  };

  const onPublishPressed = async () => {
    // validations
    if (!nameText?.length) {
      Toast.show({ type: 'error', text1: 'Please give your project a title!' });
      return;
    }

    // sync texts to redux
    CreateProjectReduxActions.setProject({ name: nameText, description: descriptionText });

    if (!images?.length && !videos?.length) {
      Toast.show({ type: 'error', text1: 'Please upload a video or photo of your project!' });
      return;
    }

    // publish
    if (isMediaSaved) {
      setProjectPublishing(true);
      setProjectSaving(true);
      await CreateProjectReduxActions.saveProject(true); // will go live
      setProjectSaving(false);
      setProjectPublishing(false);
      Toast.show({ text1: t('Yay! Your project is posted!') });
      CreateProjectReduxActions.clearAll();
      navigation.navigate('Root', { screen: 'ProjectListTabScreen', params: { tab: 0 } });
    }
  };

  // for only the first time reaching this page, create a blank project and upload media
  useEffect(() => {
    const onEnterPage = async () => {
      setProjectSaving(true);
      if (!id) await CreateProjectReduxActions.createProject();
      setProjectSaving(false);
    };
    onEnterPage();
  }, []);

  useEffect(() => {
    const onSaveMedia = async () => {
      setProjectSaving(true);
      await CreateProjectReduxActions.saveMedia(onProgressChange);
      setMediaSaved(true);
      setProjectSaving(false);
    };
    if (id) onSaveMedia();
  }, [id, onProgressChange]);

  useEffect(() => {
    if (!onboarding?.completeProject) {
      setTimeout(() => setShowHint('completeProject'), 1000);
    } else if (!onboarding?.projectBadge) {
      setTimeout(() => setShowHint('projectBadge'), 1000);
    }
  }, []);

  return (
    <View style={styles.container}>
      <CreateProjectHeader onBackPressed={onBackPressed} onPublishPressed={onPublishPressed} isProjectSaving={isProjectSaving} />
      <ScrollView style={styles.createProjectContainer} contentContainerStyle={[styles.createProjectContentContainer, { paddingBottom: insets.bottom }]}>
        <View style={[styles.titleContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
          <TextInput
            style={[styles.titleInput, { color: Colors[colorScheme].text }]}
            placeholder="Project Title (Required)"
            onChangeText={setNameText}
            returnKeyType="done"
            maxLength={50}
            placeholderTextColor="#aaa"
            defaultValue={nameText}
          />
        </View>
        <View style={[styles.mediaAndDescription, { backgroundColor: Colors[colorScheme].contentBackground }]}>
          <View style={styles.mediaAndDescriptionTop}>
            <View style={styles.mediaContainer}>
              <MyImage
                key={thumbnailUri || 'default-thumbnail'}
                uri={thumbnailUri || (videos.length > 0 ? videos[0].localThumbnailUri : images?.[0]?.uri)}
                style={styles.mediaPreview}
                params={thumbnailPreviewParams}
                defaultSource={DefaultProjectPictureTyped}
              />
              <TouchableOpacity style={styles.selectThumbnail} onPress={() => navigation.navigate('SelectThumbnailScreen')}>
                <MyText style={{ color: '#fff', fontWeight: '400', fontSize: 14 }}>Select Thumbnail</MyText>
              </TouchableOpacity>
            </View>
            <View style={styles.description}>
              <TextInput
                style={[styles.descriptionInput, { color: Colors[colorScheme].text }]}
                placeholder="What Inspired You? (Optional)"
                multiline
                onChangeText={setDescriptionText}
                returnKeyType="done"
                blurOnSubmit={true}
                maxLength={120}
                placeholderTextColor="#aaa"
                defaultValue={descriptionText}
              />
            </View>
          </View>
          {isSavingMedia ? (
            <View style={{ height: 26 }}>
              <View style={styles.progress}>
                <MyText style={{ color: '#aaa', fontWeight: '400', marginRight: 6, fontSize: 12 }}>
                  {numberOfMediaSaved}/{numberOfMediaToSave} Uploaded...
                </MyText>
                <ActivityIndicator size={10} color={Colors[colorScheme].tint} />
              </View>
              <ProgressBar progress={numberOfMediaSaved / numberOfMediaToSave} color={Colors[colorScheme].tint} indeterminate={!numberOfMediaSaved} />
            </View>
          ) : (
            <View style={{ height: 26 }} />
          )}
        </View>
        <View style={[styles.contentCategoriesAndFiles, { backgroundColor: Colors[colorScheme].contentBackground }]}>
          <TouchableOpacity style={styles.rowButton} onPress={() => setShowContentBottomSheet(true)}>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <MyText>How Did You Make This?</MyText>
              <MyText style={{ color: '#aaa', marginLeft: 6, flex: 1 }} numberOfLines={1}>
                {content || '(Optional)'}
              </MyText>
            </View>
            <Ionicons name="ios-chevron-forward-outline" size={20} color="#aaa" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton} onPress={() => setShowCategoryBottomSheet(true)}>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row' }}>
                <MyText>Add Category</MyText>
                {!projectCategories?.length && <MyText style={{ color: '#aaa', marginLeft: 6 }}>(Optional)</MyText>}
              </View>
              <Ionicons name="ios-chevron-forward-outline" size={20} color="#aaa" />
            </View>
            {!!projectCategories && (
              <View style={{ flexDirection: 'row', width: '100%', flexWrap: 'wrap' }}>
                {projectCategories?.map((pc) => (
                  <View key={`preview-category_${pc.id}`} style={[styles.previewChip, { backgroundColor: Colors[colorScheme].textInput }]}>
                    <MyText style={{ fontSize: 12, fontWeight: '400' }}>{pc.name}</MyText>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton} onPress={() => setShowFileBottomSheet(true)}>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row' }}>
                <MyText>Attach Files</MyText>
                <MyText style={{ color: '#aaa', marginLeft: 6 }}>{files.length > 0 ? files.map((f) => f.name).join(', ') : '(Optional)'}</MyText>
              </View>
              <Ionicons name="ios-chevron-forward-outline" size={20} color="#aaa" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '100%' }} onPress={() => setShowAuthorBottomSheet(true)} activeOpacity={0.5}>
            <View style={styles.categoryButton}>
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row' }}>
                  <MyText>Add Collaborators</MyText>
                  <MyText style={{ color: authorUsers?.length > 1 ? Colors[colorScheme].text : '#aaa', marginLeft: 6 }}>
                    {authorUsers?.length > 1 ? `(${authorUsers?.length})` : '(Optional)'}
                  </MyText>
                </View>
                <Ionicons name="ios-chevron-forward-outline" size={20} color="#aaa" />
              </View>
            </View>
            {authorUsers?.length > 1 && (
              <ScrollView contentContainerStyle={styles.authors} horizontal>
                {authorUsers.map((author) => (
                  <TouchableOpacity
                    key={`author_${author?.id}`}
                    style={styles.authorCompactItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedAuthor(author);
                      setShowAuthorBottomSheet(true);
                    }}
                  >
                    <MyImage
                      key={`project-author_${author?.id}`}
                      uri={author?.profileImageUri}
                      defaultSource={DefaultProfilePictureTyped}
                      params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                      style={styles.profileImage}
                    />
                    <MyText style={styles.authorCompactItemName} numberOfLines={1}>
                      {author?.name}
                    </MyText>
                    <MyText style={{ ...styles.authorCompactItemText, color: Colors[colorScheme].textSecondary }}>{author?.role}</MyText>
                    {author.id !== authorUserId && (
                      <TouchableOpacity
                        style={styles.removeAuthorButton}
                        activeOpacity={0.7}
                        onPress={() => CreateProjectReduxActions.setProject({ authorUsers: authorUsers.filter((au) => au.id !== author.id) })}
                      >
                        <Ionicons name="ios-remove-circle-sharp" size={24} color={Colors[colorScheme].error} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </View>
        <MyTooltip
          isVisible={showHint === 'completeProject'}
          text="Only completed projects can earn badges!"
          placement="bottom"
          allowChildInteraction={false}
          onClose={() => {
            OnboardingReduxActions.save({ completeProject: true });
            if (!onboarding?.projectBadge) {
              setShowHint('projectBadge');
            } else {
              setShowHint('');
            }
          }}
        >
          <View style={[styles.toggleCompleteContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <MyText>Is this a completed project?</MyText>
            <Switch
              trackColor={{ true: '#7353ff' }}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(v) => CreateProjectReduxActions.setProject({ isCompleted: v })}
              value={isCompleted}
            />
          </View>
        </MyTooltip>
        {isCompleted && (
          <MyTooltip
            isVisible={showHint === 'projectBadge'}
            text="Choose the awards to earn with this project!"
            placement="bottom"
            onClose={() => {
              OnboardingReduxActions.save({ projectBadge: true });
              setShowHint('');
            }}
          >
            <View style={[styles.badgesContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
              <TouchableOpacity style={styles.rowButton} onPress={() => navigation.navigate('SelectBadgeModalScreen', { isChallenge: true })}>
                <MyText>Submit Challenges</MyText>
                <Ionicons name="ios-chevron-forward-outline" size={20} color="#aaa" />
              </TouchableOpacity>
              <View style={styles.badgeList}>
                {badges
                  ?.filter((b) => b.isChallenge)
                  ?.map((challenge) => (
                    <View key={`challenge-row_${challenge?.id}`} style={styles.badgeItem}>
                      <MyImage
                        uri={challenge.imageUri}
                        defaultSource={DefaultProfilePictureTyped}
                        params={challengeImageParams}
                        style={styles.challengeImage}
                      />
                      <MyText style={{ fontWeight: '400' }} numberOfLines={1}>
                        {challenge.name}
                      </MyText>
                    </View>
                  ))}
              </View>
            </View>
            <View style={[styles.badgesContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
              <TouchableOpacity style={styles.rowButton} onPress={() => navigation.navigate('SelectBadgeModalScreen')}>
                <MyText>Submit Badges</MyText>
                <Ionicons name="ios-chevron-forward-outline" size={20} color="#aaa" />
              </TouchableOpacity>
              <View style={styles.badgeList}>
                {badges
                  ?.filter((b) => !b.isChallenge)
                  ?.map((badge) => (
                    <View key={`badge-row_${badge?.id}`} style={styles.badgeItem}>
                      <MyImage
                        uri={badge.imageUri}
                        defaultSource={DefaultProfilePictureTyped}
                        params={badgeImageParams}
                        style={styles.badgeImage}
                        imageFormat="png"
                      />
                      <MyText style={{ fontWeight: '400' }} numberOfLines={1}>
                        {badge.name}
                      </MyText>
                    </View>
                  ))}
              </View>
            </View>
          </MyTooltip>
        )}
      </ScrollView>
      <ContentBottomSheet show={showContentBottomSheet} handleClose={() => setShowContentBottomSheet(false)} />
      <CategoryBottomSheet show={showCategoryBottomSheet} handleClose={() => setShowCategoryBottomSheet(false)} />
      <FileBottomSheet show={showFileBottomSheet} handleClose={() => setShowFileBottomSheet(false)} />
      <CollaboratorBottomSheet
        author={selectedAuthor}
        show={showAuthorBottomSheet}
        handleClose={() => {
          setShowAuthorBottomSheet(false);
          setSelectedAuthor(null);
        }}
      />
      <OverlayLoader show={isProjectPublishing} text="Posting" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createProjectContainer: {
    flex: 1,
    width: '100%',
  },
  createProjectContentContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    width: '100%',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: 'rgba(160, 160, 160, 0.3)',
    borderBottomWidth: 0.5,
  },
  titleInput: {
    height: 50,
    paddingHorizontal: 18,
    fontSize: 20,
    width: '100%',
  },
  mediaAndDescription: {
    width: '100%',
    padding: 16,
  },
  mediaAndDescriptionTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  mediaContainer: {
    width: 160,
    height: 90,
    borderRadius: 4,
  },
  selectThumbnail: {
    height: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  description: {
    flex: 1,
    marginLeft: 12,
    height: 100,
  },
  descriptionInput: {
    paddingBottom: 0,
    textAlignVertical: 'top',
  },
  progress: {
    height: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  contentCategoriesAndFiles: {
    width: '100%',
    marginVertical: 12,
  },
  previewChip: {
    height: 30,
    borderRadius: 15,
    marginTop: 10,
    marginRight: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowButton: {
    padding: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryButton: {
    padding: 12,
    flexDirection: 'column',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  authors: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  authorCompactItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 120,
  },
  authorCompactItemName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '400',
  },
  authorCompactItemText: {
    fontSize: 12,
    fontWeight: '400',
    marginVertical: 2,
  },
  removeAuthorButton: {
    position: 'absolute',
    top: 0,
    right: 10,
  },
  toggleCompleteContainer: {
    width: '100%',
    height: 50,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgesContainer: {
    width: '100%',
    marginTop: 12,
  },
  badgeList: {
    flex: 1,
  },
  badgeItem: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  badgeImage: {
    width: 30,
    height: 34.5,
    borderRadius: 12,
    marginHorizontal: 12,
  },
  challengeImage: {
    width: 48,
    height: 36,
    borderRadius: 4,
    marginHorizontal: 18,
  },
});
