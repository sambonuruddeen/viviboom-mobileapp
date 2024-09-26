import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPalLoadingAnim from 'rn-viviboom/assets/animations/builder-pal-loading.json';
import BuilderPalNoResultAnim from 'rn-viviboom/assets/animations/builder-pal-no-result.json';
import BuilderPalProjectAnim from 'rn-viviboom/assets/animations/builder-pal-project.json';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyText from 'rn-viviboom/hoc/MyText';
import ProjectListItem from 'rn-viviboom/hoc/ProjectListItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackScreenProps } from 'rn-viviboom/navigation/types';

const DEFAULT_LIMIT = 20;

const padding = 12;

export default function BuilderPalRelatedProjectListScreen({ navigation, route }: BuilderPalStackScreenProps<'BuilderPalRelatedProjectListScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useReduxStateSelector((state) => state.account);

  const [isEndOfProjects, setIsEndOfProjects] = useState(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const isEmptyResult = !projects.length && isEndOfProjects;

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
        };
        const res = await BuilderPalApi.getRelatedProjects(requestParams);
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

  const flatListRenderItem = useCallback(
    ({ item }: { item: Project }) => (
      <View style={[styles.itemContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <ProjectListItem id={item.id} preloadedData={item} showProfile />
      </View>
    ),
    [colorScheme],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={{ padding }}>
        <View style={[styles.projectPrompt, { backgroundColor: Colors[colorScheme].background }]}>
          <View style={styles.animContainer}>
            {isEmptyResult && <LottieView source={BuilderPalNoResultAnim} style={styles.anim} loop autoPlay />}
            {!isEmptyResult && isFetchingProjects && <LottieView source={BuilderPalLoadingAnim} style={styles.anim} loop autoPlay />}
            {!isEmptyResult && !isFetchingProjects && <LottieView source={BuilderPalProjectAnim} style={styles.anim} loop autoPlay />}
          </View>
          <MyText style={styles.guidingTitle}>
            {t(
              isEmptyResult
                ? 'Oops, no luck finding a perfect match on Viviboom. Shall we dream up some projects?'
                : `${
                  isFetchingProjects
                    ? 'Hang on for a sec, diving into the Viviboom project pool!'
                    : 'Hey, check out these related projects available on Viviboom! 😊'
                }`,
            )}
          </MyText>
        </View>
      </View>
    ),
    [colorScheme, isEmptyResult, isFetchingProjects, t],
  );

  const ListFooterComponent = useMemo(
    () => (
      <View style={styles.footerContainer}>
        {isFetchingProjects && (
          <Animated.View style={[styles.loading, { opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }]}>
            <ActivityIndicator size={18} />
            <MyText style={styles.loadingText}>{t('BuilderPal is thinking hard...')}</MyText>
          </Animated.View>
        )}
        {!isFetchingProjects && isEndOfProjects && !isEmptyResult && <MyText style={styles.noItemFoundText}>{t('Yay! You have seen it all!')}</MyText>}
      </View>
    ),
    [bounceAnimation, isEmptyResult, isEndOfProjects, isFetchingProjects, t],
  );

  const ListEmptyComponent = useMemo(
    () => !isFetchingProjects && isEndOfProjects && <MyText style={styles.noItemFoundText}>{t('No related project found on Viviboom')}</MyText>,
    [isEndOfProjects, isFetchingProjects, t],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].contentBackground, paddingTop: insets.top, height: insets.top + 60 }]}>
        <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.pop()}>
          <Ionicons name="ios-chevron-back-outline" size={28} color={Colors[colorScheme].text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.topButton} onPress={() => navigation.navigate('BuilderPalHomeScreen')} activeOpacity={0.8}>
          <Ionicons name="ios-home-outline" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      </View>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={projects}
        renderItem={flatListRenderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={() => fetchProjects(false)}
        keyExtractor={(item: Project) => `builderPal-project_${item.id}`}
        refreshing={isFetchingProjects}
      />
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
    width: '100%',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 30,
  },
  loadingText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '400',
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
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
