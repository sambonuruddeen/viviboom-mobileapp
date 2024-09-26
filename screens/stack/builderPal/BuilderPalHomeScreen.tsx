import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPalImage from 'rn-viviboom/assets/images/minichatavatar.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BuilderPalChatType } from 'rn-viviboom/enums/BuilderPalChatType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackScreenProps } from 'rn-viviboom/navigation/types';

import BuilderPalProjectItem from './BuilderPalProjectItem';

const DEFAULT_LIMIT = 12;
const DEFAULT_CHAT_LIMIT = 6;

export default function BuilderPalHomeScreen({ navigation, route }: BuilderPalStackScreenProps<'BuilderPalHomeScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const user = useReduxStateSelector((state) => state.account);

  const [loading, setLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);

  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [chatCount, setChatCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [isEndOfProjects, setIsEndOfProjects] = useState(false);

  const isEmptyResult = !projects.length && isEndOfProjects;

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await BuilderPalApi.getList({
        authToken: user.authToken,
        types: [BuilderPalChatType.CONVERSATIONAL, BuilderPalChatType.DISCOVERY, BuilderPalChatType.GUIDING],
        userId: user.id,
        limit: DEFAULT_CHAT_LIMIT,
      });
      setChats(res.data.chats);
      setChatCount(res.data?.count);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error(err.response?.data?.message || err.message);
    }
    setChatsLoading(false);
  }, [user?.authToken, user?.id]);

  const fetchProjects = useCallback(
    async (hardRefresh = false) => {
      if (!user?.authToken || loading) return;
      if (!hardRefresh && isEndOfProjects) return;
      setLoading(true);
      try {
        const requestParams = {
          authToken: user.authToken,
          limit: DEFAULT_LIMIT,
          offset: hardRefresh ? 0 : projects.length,
          isSaved: true,
        };
        const res = await BuilderPalApi.getProjects(requestParams);
        if (hardRefresh) {
          setProjects(res.data?.projects);
          setProjectCount(res.data?.count);
        } else {
          setProjects((prev) => [...prev, ...(res.data?.projects || [])]);
        }
        if (res.data?.projects?.length < DEFAULT_LIMIT) {
          setIsEndOfProjects(true);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    },
    [isEndOfProjects, loading, projects?.length, user?.authToken],
  );

  useEffect(() => {
    fetchProjects(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (isFocused) {
      fetchChats();
      fetchProjects(true);
    }
  }, [isFocused]);

  const flatListRenderItem = useCallback(
    ({ item }: { item: ChatProject }) => (
      <View style={[styles.itemContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <BuilderPalProjectItem project={item} hideSaveButton />
      </View>
    ),
    [colorScheme],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeaderContainer}>
        <View style={[styles.chatSectionContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
          <View style={styles.chatTitleContainer}>
            <MyText style={styles.chatListTitle}>
              {t('All Chats')} ({chatCount})
            </MyText>
            <TouchableOpacity onPress={() => navigation.navigate('BuilderPalSearchScreen')} activeOpacity={0.8}>
              <MyText style={{ ...styles.showMoreText, color: Colors[colorScheme].textSecondary }}>{t('Show All')}</MyText>
            </TouchableOpacity>
          </View>
          <View style={styles.chatListContainer}>
            {chatsLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size={24} />
              </View>
            )}
            {!chatsLoading &&
              chats.map((v) => (
                <TouchableOpacity
                  key={`builder-pal-chat_${v.id}`}
                  style={styles.chatItem}
                  onPress={() => navigation.navigate('BuilderPalChatScreen', { chatId: v.id })}
                  activeOpacity={0.8}
                >
                  <MyText style={styles.chatItemText} numberOfLines={1}>
                    {v.title || '(No Title)'}
                  </MyText>
                </TouchableOpacity>
              ))}
          </View>
        </View>
        <View style={styles.projectTitleContainer}>
          <MyText style={{ ...styles.projectListTitle, color: Colors[colorScheme].textSecondary }}>{t('Favorite Projects')}</MyText>
          <MyText style={styles.projectCountText}>{projectCount}</MyText>
        </View>
      </View>
    ),
    [chatCount, chats, chatsLoading, colorScheme, navigation, projectCount, t],
  );

  const ListFooterComponent = useMemo(
    () => (
      <View style={styles.footerContainer}>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size={18} />
            <MyText style={styles.loadingText}>{t('BuilderPal is thinking hard...')}</MyText>
          </View>
        )}
        {!loading && isEndOfProjects && !isEmptyResult && <MyText style={styles.noItemFoundText}>{t('Yay! You have seen it all!')}</MyText>}
      </View>
    ),
    [isEmptyResult, isEndOfProjects, loading, t],
  );

  const ListEmptyComponent = useMemo(
    () => !loading && isEndOfProjects && <MyText style={styles.noItemFoundText}>{t('No projects detected. Start chatting to save your favorites!')}</MyText>,
    [isEndOfProjects, loading, t],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].contentBackground, paddingTop: insets.top, height: insets.top + 60 }]}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.pop()}>
            <Ionicons name="ios-chevron-back-outline" size={28} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <View style={styles.status}>
            <View style={styles.statusAvatar}>
              <View style={styles.onlineDot} />
              <MyImage style={styles.avatarImage} defaultSource={BuilderPalImage} />
            </View>
            <View style={styles.statusRight}>
              <MyText style={styles.statusTitle}>{t('BuilderPal')}</MyText>
              <View style={styles.onlineContainer}>
                <MyText style={styles.onlineText}>{t('Online')}</MyText>
              </View>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.topButton} onPress={() => navigation.navigate('BuilderPalChatScreen')}>
            <Ionicons name="ios-chatbubbles-outline" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={projects}
          renderItem={flatListRenderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          onEndReached={() => fetchProjects(false)}
          keyExtractor={(item: ChatProject) => `builderPal-chat-project_${item.id}`}
          refreshing={loading}
          contentContainerStyle={{ alignItems: 'center', width: Layout.screen.width }}
          ListHeaderComponentStyle={{ width: '100%', alignItems: 'center' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: Layout.screen.width,
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
    marginTop: 6,
  },
  topButton: {
    marginRight: 24,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusAvatar: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  onlineDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: 'rgb(29, 243, 119)',
    left: -4,
    borderRadius: 3,
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  statusTitle: {
    fontSize: 16,
  },
  onlineContainer: {
    backgroundColor: 'rgb(29, 243, 119)',
    height: 18,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 3,
    justifyContent: 'center',
    alignItem: 'center',
    paddingTop: Platform.OS === 'ios' ? 2 : 0,
  },
  onlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusRight: {
    alignItems: 'flex-start',
  },
  listHeaderContainer: {
    width: '100%',
    paddingTop: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  chatSectionContainer: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: 8,
    padding: 24,
    marginVertical: 18,
    maxWidth: 360,
  },
  chatTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatListTitle: {
    fontSize: 16,
    color: '#aaa',
  },
  chatCountText: {
    fontSize: 16,
    fontWeight: '400',
  },
  chatListContainer: {
    height: DEFAULT_CHAT_LIMIT * 44,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 18,
  },
  showMoreText: {
    color: '#666',
  },
  chatItem: {
    marginTop: 20,
    paddingHorizontal: 1,
  },
  chatItemText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    textAlignVertical: 'center',
  },
  projectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 18,
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 12,
  },
  projectListTitle: {
    fontSize: 20,
  },
  projectCountText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
  },
  itemContainer: {
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: 8,
    maxWidth: 360,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '400',
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  noItemFoundText: {
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 36,
  },
  listContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
});
