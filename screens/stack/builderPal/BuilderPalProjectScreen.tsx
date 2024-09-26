import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, ImageRequireSource, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPalLoadingAnim from 'rn-viviboom/assets/animations/builder-pal-loading.json';
import BuilderPalProjectAnim from 'rn-viviboom/assets/animations/builder-pal-project.json';
import ChatBubble from 'rn-viviboom/assets/images/chat-bubble.png';
import DefaultAdvancedPicture from 'rn-viviboom/assets/images/chat-project-advanced.png';
import DefaultBeginnerPicture from 'rn-viviboom/assets/images/chat-project-beginner.png';
import DefaultIntermediatePicture from 'rn-viviboom/assets/images/chat-project-intermediate.png';
import Categories from 'rn-viviboom/assets/images/icon-categories.png';
import Clock from 'rn-viviboom/assets/images/icon-clock.png';
import StarOutline from 'rn-viviboom/assets/images/icon-star-outline.png';
import Star from 'rn-viviboom/assets/images/icon-star.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackScreenProps } from 'rn-viviboom/navigation/types';
import { calculateDayHourMinutes } from 'rn-viviboom/utils/TimeUtil';

import BuilderPalProjectFooter from './BuilderPalProjectFooter';
import BuilderPalProjectHeader from './BuilderPalProjectHeader';

const DefaultAdvancedPictureTyped = DefaultAdvancedPicture as ImageRequireSource;
const DefaultBeginnerPictureTyped = DefaultBeginnerPicture as ImageRequireSource;
const DefaultIntermediatePictureTyped = DefaultIntermediatePicture as ImageRequireSource;

const difficultyLevels = {
  BEGINNER: {
    stars: [Star, StarOutline, StarOutline],
    label: 'Beginner',
    defaultBackgroundImage: DefaultBeginnerPictureTyped,
  },
  INTERMEDIATE: {
    stars: [Star, Star, StarOutline],
    label: 'Intermediate',
    defaultBackgroundImage: DefaultIntermediatePictureTyped,
  },
  ADVANCED: {
    stars: [Star, Star, Star],
    label: 'Advanced',
    defaultBackgroundImage: DefaultAdvancedPictureTyped,
  },
};

const footerHeight = 44;
const carouselHeight = 280;

function MyCheckbox() {
  const colorScheme = useColorScheme();
  const [checked, setChecked] = useState(false);
  return (
    <TouchableOpacity
      style={[
        styles.checkboxBase,
        { borderColor: Colors[colorScheme].tint },
        checked && { borderColor: Colors[colorScheme].tint, backgroundColor: Colors[colorScheme].tint },
      ]}
      onPress={() => setChecked((b) => !b)}
      activeOpacity={1}
    >
      {checked && <Ionicons name="checkmark-sharp" size={14} color={Colors[colorScheme].textInverse} />}
    </TouchableOpacity>
  );
}

export default function BuilderPalProjectScreen({ navigation, route }: BuilderPalStackScreenProps<'BuilderPalProjectScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useReduxStateSelector((state) => state.account);

  const [project, setProject] = useState<ChatProject>();
  const [loading, setLoading] = useState(true);

  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(-1);

  const isLastStep = project?.instructions && currentInstructionIndex === project.instructions.length - 1;
  const isFirstStep = !currentInstructionIndex;

  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(0)).current;

  const bounceAnim = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const fadeInAnim = () => {
    Animated.timing(fadeInAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const fetchProject = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await BuilderPalApi.getProject({
        authToken: user.authToken,
        chatId: route.params?.chatId,
        chatProjectId: route.params?.chatProjectId,
        shouldGenerateProjectDetails: true,
      });
      setProject(res.data?.project);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ type: 'error', text1: err.message });
      console.error(err);
    }
    setLoading(false);
  }, [route.params?.chatId, route.params?.chatProjectId, user.authToken]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    bounceAnim();
  }, []);

  useEffect(() => {
    if (loading) fadeInAnim();
  }, [loading]);

  const timeToComplete = useMemo(() => {
    const { day, hour, minute } = calculateDayHourMinutes(project?.timeToComplete || 0);
    return [
      day > 0 ? t('challenges.day', { count: day }) : null,
      hour > 0 ? t('challenges.hour', { count: hour }) : null,
      minute > 0 ? t('challenges.minute', { count: minute }) : null,
    ]
      .filter(Boolean)
      .join(' ');
  }, [project?.timeToComplete, t]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: footerHeight + insets.bottom + Layout.bottomNavigatorBarHeight }]}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: offset } } }], { useNativeDriver: false })}
        overScrollMode="never"
      >
        <View>
          {!!project?.difficulty && <Image style={styles.projectImage} source={difficultyLevels[project?.difficulty]?.defaultBackgroundImage} />}
          <View style={styles.promptContainer}>
            <LottieView source={BuilderPalProjectAnim} style={styles.promptAnim} loop autoPlay />
            <View style={styles.chatBubbleContainer}>
              <Image source={ChatBubble} style={styles.chatBubble} />
              <View style={styles.chatBubbleTextContainer}>
                <MyText style={styles.chatBubbleText}>{t('Psst! Got Questions? Hit the button in the bottom anytime!')}</MyText>
              </View>
            </View>
          </View>
        </View>
        {currentInstructionIndex < 0 && (
          <>
            <View style={styles.projectTitle}>
              <MyText style={styles.titleText}>{project?.title}</MyText>
            </View>
            <View style={styles.descriptionTextContainer}>
              <MyText style={styles.descriptionText}>{project?.description}</MyText>
            </View>
            <View style={styles.tags}>
              {project?.difficulty && (
                <View style={[styles.topTabInfo, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
                  <View style={{ flexDirection: 'row', marginRight: 8 }}>
                    {!!project?.difficulty &&
                      difficultyLevels[project.difficulty].stars.map((star, index) => <Image key={`star-${index}`} style={styles.logo} source={star} />)}
                  </View>
                  <MyText style={styles.tagText}>{difficultyLevels[project?.difficulty].label}</MyText>
                </View>
              )}
              {project?.timeToComplete && (
                <View style={[styles.topTabInfo, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
                  <Image style={[styles.logo, { marginRight: 8 }]} source={Clock} />
                  <MyText style={styles.tagText}>{timeToComplete}</MyText>
                </View>
              )}
              {project?.categories && project?.categories.length > 0 && (
                <View style={[styles.topTabInfo, { backgroundColor: Colors[colorScheme].secondaryBackground }]} key={project?.categories[0]?.name}>
                  <Image style={[styles.logo, { marginRight: 8 }]} source={Categories} />
                  <MyText style={styles.tagText}>{project?.categories[0]?.name}</MyText>
                </View>
              )}
            </View>
            <View style={[styles.divider, { borderBottomColor: Colors[colorScheme].textInput }]} />
            <View style={styles.section}>
              <MyText style={styles.sectionTitle}>{t('Materials & Resources')}</MyText>
              <View style={styles.materialList}>
                {project?.resources?.map((v) => (
                  <View key={`resource-${v.name}`} style={styles.resource}>
                    <MyCheckbox />
                    <MyText style={styles.resourceText}>{t(v.name)}</MyText>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.section}>
              <MyText style={styles.sectionTitle}>{t('Step Overview')}</MyText>
              <View style={styles.materialList}>
                {project?.instructions?.map((v, index) => (
                  <TouchableOpacity key={`resource-${v.title}`} style={styles.resource} onPress={() => setCurrentInstructionIndex(index)} activeOpacity={0.8}>
                    {!!index && <View style={[styles.bulletLine, { borderLeftColor: Colors[colorScheme].tint }]} />}
                    <View style={[styles.bullet, { borderColor: Colors[colorScheme].tint, backgroundColor: Colors[colorScheme].background }]} />
                    <MyText style={styles.stepText}>{t(v.title)}</MyText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <MyButton style={styles.buildButton} onPress={() => setCurrentInstructionIndex(0)} mode="contained">
              {t("Let's Start Building!")}
            </MyButton>
          </>
        )}
        {currentInstructionIndex >= 0 && (
          <View style={styles.instruction}>
            <View style={styles.instructionTitle}>
              <MyText style={styles.instructionTitleText}>{project?.instructions?.[currentInstructionIndex]?.title}</MyText>
            </View>
            <View style={styles.instructionDescriptionTextContainer}>
              <MyText style={styles.instructionDescriptionText}>{project?.instructions?.[currentInstructionIndex]?.content}</MyText>
            </View>
            <View style={styles.instructionButtons}>
              <MyButton
                style={styles.instructionButton}
                onPress={() => setCurrentInstructionIndex(currentInstructionIndex - 1)}
                mode={isFirstStep ? 'contained' : 'outlined'}
                labelStyle={{ marginHorizontal: 0 }}
              >
                {t(isFirstStep ? 'Back to project' : 'Back')}
              </MyButton>
              <MyButton
                style={{ ...styles.instructionButton, marginRight: 18, ...(isLastStep && { borderColor: '#aaa' }) }}
                labelStyle={{ ...(isLastStep && { color: '#aaa' }) }}
                onPress={() => setCurrentInstructionIndex(currentInstructionIndex + 1)}
                mode="outlined"
                disabled={currentInstructionIndex === project.instructions.length - 1}
              >
                {t(isLastStep ? 'Last Step' : 'Next')}
              </MyButton>
            </View>
          </View>
        )}
      </ScrollView>
      <BuilderPalProjectFooter project={project} />
      <BuilderPalProjectHeader onBackPressed={() => navigation.pop()} animatedOffset={offset} carouselHeight={carouselHeight} />
      {loading && (
        <View style={[styles.hideAll, { backgroundColor: Colors[colorScheme].background }]}>
          <Animated.View style={[styles.loadingContainer, { opacity: fadeInAnimation }]}>
            <View style={styles.animContainer}>
              <LottieView source={BuilderPalLoadingAnim} style={styles.anim} loop autoPlay />
            </View>
            <Animated.View style={{ opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0.3] }) }}>
              <MyText style={styles.loadingText}>{t('Hold up a sec, tweaking project details in my mind!')}</MyText>
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxBase: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
    borderWidth: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  contentContainer: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  projectImage: {
    width: Layout.screen.width,
    height: carouselHeight,
  },
  promptContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  promptAnim: {
    width: carouselHeight * 0.7,
    height: carouselHeight * 0.7,
  },
  chatBubbleContainer: {
    width: 240,
    height: 140,
    marginBottom: 20,
    opacity: 0.9,
  },
  chatBubble: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    position: 'relative',
    left: -30,
    top: -30,
  },
  chatBubbleTextContainer: {
    position: 'absolute',
    top: 10,
    left: 34,
    width: 150,
  },
  chatBubbleText: {
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    lineHeight: 20,
    opacity: 0.8,
    color: '#000',
  },
  projectTitle: {
    marginHorizontal: 28,
    paddingTop: 44,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  titleText: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionTextContainer: {
    marginVertical: 24,
    marginHorizontal: 48,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  descriptionText: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 20,
    color: '#aaa',
  },
  tags: {
    width: '100%',
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  topTabInfo: {
    height: 32,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 12,
    marginBottom: 12,
  },
  logo: {
    width: 16,
    height: 16,
  },
  tagText: {
    fontWeight: '400',
    textAlign: 'center',
    fontSize: 15,
  },
  divider: {
    marginVertical: 12,
    width: Layout.screen.width - 2 * 18,
    borderBottomColor: '#aaa',
    borderBottomWidth: 1.5,
  },
  section: {
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  materialList: {
    width: '100%',
    marginVertical: 18,
    paddingHorizontal: 2,
  },
  resource: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  resourceText: {
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 40,
    marginHorizontal: 12,
  },
  bullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    zIndex: 100,
  },
  bulletLine: {
    position: 'absolute',
    bottom: 22.5,
    left: 7.5,
    height: 40,
    borderLeftWidth: 1,
    opacity: 0.3,
  },
  stepText: {
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 44,
    marginHorizontal: 12,
  },
  buildButton: {
    width: Layout.screen.width - 2 * 18,
    borderRadius: 8,
    marginVertical: 12,
  },
  instruction: {
    width: '100%',
  },
  instructionTitle: {
    marginHorizontal: 24,
    paddingTop: 44,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  instructionTitleText: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
  },
  instructionDescriptionTextContainer: {
    margin: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  instructionDescriptionText: {
    fontWeight: '600',
    fontSize: 18,
    color: '#aaa',
    lineHeight: 22,
  },
  instructionButtons: {
    flexDirection: 'row',
    width: Layout.screen.width,
    marginVertical: 18,
  },
  instructionButton: {
    flex: 1,
    marginLeft: 18,
    borderRadius: 8,
    borderWidth: 1,
  },
  hideAll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  animContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: Layout.screen.width * 0.5,
    height: Layout.screen.width * 0.5,
  },
  anim: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 20,
    lineHeight: 24,
    marginHorizontal: 48,
    textAlign: 'center',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
