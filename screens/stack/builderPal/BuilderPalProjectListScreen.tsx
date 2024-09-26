import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPalLoadingAnim from 'rn-viviboom/assets/animations/builder-pal-loading.json';
import BuilderPalProjectAnim from 'rn-viviboom/assets/animations/builder-pal-project.json';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import MyTooltip from 'rn-viviboom/hoc/MyTooltip';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackScreenProps } from 'rn-viviboom/navigation/types';
import OnboardingReduxActions from 'rn-viviboom/redux/onboarding/OnboardingReduxActions';

import BuilderPalProjectItem from './BuilderPalProjectItem';

const DEFAULT_LIMIT = 4;

const padding = 12;

export default function BuilderPalProjectListScreen({ navigation, route }: BuilderPalStackScreenProps<'BuilderPalProjectListScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useReduxStateSelector((state) => state.account);
  const onboarding = useReduxStateSelector((state) => state.onboarding);

  const [isEndOfProjects, setIsEndOfProjects] = useState(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [showHint, setShowHint] = useState<string>();

  const bounceAnimation = useRef(new Animated.Value(0)).current;

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

  const fetchProjects = useCallback(
    async (hardRefresh = false) => {
      if (!user?.authToken || !route.params?.chatId || isFetchingProjects) return;
      if (!hardRefresh && isEndOfProjects) return;
      setIsFetchingProjects(true);
      try {
        const requestParams = {
          authToken: user.authToken,
          limit: DEFAULT_LIMIT,
          offset: hardRefresh ? 0 : projects.length,
          chatId: route.params?.chatId,
          shouldGenerateProject: true,
        };
        const res = await BuilderPalApi.getChatProjects(requestParams);
        if (hardRefresh) {
          setProjects(res.data?.projects);
        } else {
          setProjects((prev) => [...prev, ...(res.data?.projects || [])]);
        }
        if (res.data.projects.length < DEFAULT_LIMIT) {
          setIsEndOfProjects(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingProjects(false);
    },
    [user.authToken, route.params?.chatId, isFetchingProjects, isEndOfProjects, projects.length],
  );

  useEffect(() => {
    fetchProjects(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bounceAnim();
  }, []);

  useEffect(() => {
    if (!onboarding?.builderPalHome) setTimeout(() => setShowHint('builderPalProjectLike'), 1500);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].contentBackground, paddingTop: insets.top, height: insets.top + 60 }]}>
        <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.pop()}>
          <Ionicons name="ios-chevron-back-outline" size={28} color={Colors[colorScheme].text} />
        </TouchableOpacity>

        <MyTooltip
          isVisible={showHint === 'builderPalHome'}
          text="View Favorited Projects Here"
          placement="bottom"
          onClose={() => {
            OnboardingReduxActions.save({ builderPalHome: true });
            setShowHint('');
          }}
        >
          <TouchableOpacity style={styles.topButton} onPress={() => navigation.navigate('BuilderPalHomeScreen')} activeOpacity={0.8}>
            <Ionicons name="ios-home-outline" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </MyTooltip>
      </View>
      <ScrollView contentContainerStyle={{ padding, alignItems: 'center' }}>
        <View style={[styles.projectPrompt, { backgroundColor: Colors[colorScheme].background }]}>
          <View style={styles.animContainer}>
            {isFetchingProjects ? (
              <LottieView source={BuilderPalLoadingAnim} style={styles.anim} loop autoPlay />
            ) : (
              <LottieView source={BuilderPalProjectAnim} style={styles.anim} loop autoPlay />
            )}
          </View>
          <MyText style={styles.guidingTitle}>
            {t(isFetchingProjects ? 'Hold up a sec, tweaking project details in my mind!' : 'I dreamt up some fun projects. Let me know what you think!')}
          </MyText>
        </View>
        <View style={styles.listContainer}>
          {projects.map((p, index) => (
            <View key={`builderpal-project_${p.id}`} style={[styles.itemContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
              <BuilderPalProjectItem
                project={p}
                showTutorial={!index && showHint === 'builderPalProjectLike'}
                showNextTutorial={() => setShowHint('builderPalHome')}
              />
            </View>
          ))}
        </View>
        {isFetchingProjects && (
          <Animated.View style={[styles.loading, { opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }]}>
            <ActivityIndicator size={18} />
            <MyText style={styles.loadingText}>{t('BuilderPal is thinking hard...')}</MyText>
          </Animated.View>
        )}
        {!isFetchingProjects && (
          <MyButton style={styles.loadMore} onPress={() => fetchProjects(false)} mode="contained">
            {t('Load More')}
          </MyButton>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 0.5,
    elevation: 2,
  },
  settingBtn: {
    marginHorizontal: 8,
  },
  topButton: {
    marginRight: 24,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 36,
    fontSize: 12,
  },
  itemContainer: {
    marginVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: 8,
    maxWidth: 360,
    width: '100%',
  },
  listContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
    width: '100%',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '400',
  },
  loadMore: {
    borderRadius: 8,
    marginVertical: 18,
    maxWidth: 360,
    width: '100%',
  },
  projectPrompt: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: 8,
    marginVertical: 8,
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
  guidingTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
    width: '100%',
    textAlign: 'center',
  },
});
