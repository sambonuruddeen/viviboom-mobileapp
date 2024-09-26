import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPalLoadingAnim from 'rn-viviboom/assets/animations/builder-pal-loading.json';
import BuilderPalNoResultAnim from 'rn-viviboom/assets/animations/builder-pal-no-result.json';
import BuilderPalChallengeAnim from 'rn-viviboom/assets/animations/builder-pal-project.json';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import ChallengeGridItem from 'rn-viviboom/hoc/ChallengeGridItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackScreenProps } from 'rn-viviboom/navigation/types';

const DEFAULT_LIMIT = 20;

const padding = 12;
const itemWidth = Layout.screen.width / 2 - 1.5 * padding;

export default function BuilderPalChallengeListScreen({ navigation, route }: BuilderPalStackScreenProps<'BuilderPalChallengeListScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useReduxStateSelector((state) => state.account);

  const [isEndOfChallenges, setIsEndOfChallenges] = useState(false);
  const [isFetchingChallenges, setIsFetchingChallenges] = useState(false);
  const [challenges, setChallenges] = useState<Badge[]>([]);

  const isEmptyResult = !challenges.length && isEndOfChallenges;

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

  const fetchChallenges = useCallback(
    async (hardRefresh = false) => {
      if (!user?.authToken || !route.params?.chatId || isFetchingChallenges) return;
      if (!hardRefresh && isEndOfChallenges) return;
      setIsFetchingChallenges(true);
      try {
        const requestParams = {
          authToken: user.authToken,
          limit: DEFAULT_LIMIT,
          offset: hardRefresh ? 0 : challenges.length,
          chatId: route.params?.chatId,
        };
        const res = await BuilderPalApi.getChallenges(requestParams);
        if (hardRefresh) {
          setChallenges(res.data?.challenges);
        } else {
          setChallenges((prev) => [...prev, ...(res.data?.challenges || [])]);
        }
        if (res.data.challenges.length < DEFAULT_LIMIT) {
          setIsEndOfChallenges(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingChallenges(false);
    },
    [user.authToken, route.params?.chatId, isFetchingChallenges, isEndOfChallenges, challenges.length],
  );

  useEffect(() => {
    fetchChallenges(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bounceAnim();
  }, []);

  const flatListRenderItem = useCallback(
    ({ item }: { item: Badge }) => (
      <View style={[styles.itemContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <ChallengeGridItem preloadedData={item} width={itemWidth} />
      </View>
    ),
    [colorScheme],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={{ padding }}>
        <View style={[styles.challengePrompt, { backgroundColor: Colors[colorScheme].background }]}>
          <View style={styles.animContainer}>
            {isEmptyResult && <LottieView source={BuilderPalNoResultAnim} style={styles.anim} loop autoPlay />}
            {!isEmptyResult && isFetchingChallenges && <LottieView source={BuilderPalLoadingAnim} style={styles.anim} loop autoPlay />}
            {!isEmptyResult && !isFetchingChallenges && <LottieView source={BuilderPalChallengeAnim} style={styles.anim} loop autoPlay />}
          </View>
          <MyText style={styles.guidingTitle}>
            {t(
              isEmptyResult
                ? 'Oops, no luck finding a perfect match on Viviboom. Shall we dream up some projects?'
                : `${
                  isFetchingChallenges
                    ? 'Hang on for a sec, diving into the Viviboom challenge pool!'
                    : 'Hey, check out these related challenges available on Viviboom! 😊'
                }`,
            )}
          </MyText>
        </View>
      </View>
    ),
    [colorScheme, isEmptyResult, isFetchingChallenges, t],
  );

  const ListFooterComponent = useMemo(
    () => (
      <View style={styles.footerContainer}>
        {isFetchingChallenges && (
          <Animated.View style={[styles.loading, { opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }]}>
            <ActivityIndicator size={18} />
            <MyText style={styles.loadingText}>{t('BuilderPal is thinking hard...')}</MyText>
          </Animated.View>
        )}
        {!isFetchingChallenges && isEndOfChallenges && !isEmptyResult && <MyText style={styles.noItemFoundText}>{t('Yay! You have seen it all!')}</MyText>}
      </View>
    ),
    [bounceAnimation, isEmptyResult, isEndOfChallenges, isFetchingChallenges, t],
  );

  const ListEmptyComponent = useMemo(
    () => !isFetchingChallenges && isEndOfChallenges && <MyText style={styles.noItemFoundText}>{t('No related challenge found on Viviboom')}</MyText>,
    [isEndOfChallenges, isFetchingChallenges, t],
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
        data={challenges}
        renderItem={flatListRenderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={() => fetchChallenges(false)}
        keyExtractor={(item: Badge) => `builderPal-challenge_${item.id}`}
        refreshing={isFetchingChallenges}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: padding }}
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
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: itemWidth,
    borderRadius: 8,
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
  challengePrompt: {
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
