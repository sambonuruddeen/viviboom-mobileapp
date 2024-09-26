import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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

const DEFAULT_CHAT_LIMIT = 50;
const DEFAULT_PROJECT_LIMIT = 4;

export default function BuilderPalSearchScreen({ navigation }: BuilderPalStackScreenProps<'BuilderPalSearchScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useReduxStateSelector((state) => state.account);

  const [searchKeywords, setSearchKeywords] = useState<string>('');

  const [chats, setChats] = useState<Chat[]>([]);
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [isEndOfChats, setIsEndOfChats] = useState(false);

  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);

  const [chatCount, setChatCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);

  const fetchChats = useCallback(
    async (hardRefresh = true) => {
      if (!user?.authToken || isFetchingChats) return;
      if (!hardRefresh && isEndOfChats) return;
      if (hardRefresh) setIsEndOfChats(false);

      setIsFetchingChats(true);
      try {
        const res = await BuilderPalApi.getList({
          authToken: user.authToken,
          types: [BuilderPalChatType.CONVERSATIONAL, BuilderPalChatType.DISCOVERY, BuilderPalChatType.GUIDING],
          userId: user.id,
          keywords: searchKeywords,
          limit: DEFAULT_CHAT_LIMIT,
          offset: hardRefresh ? 0 : chats.length,
        });
        if (hardRefresh) {
          setChats(res.data.chats);
          setChatCount(res.data?.count);
        } else {
          setChats((prev) => [...prev, ...(res.data?.chats || [])]);
        }
        if (res.data?.chats?.length < DEFAULT_CHAT_LIMIT) {
          setIsEndOfChats(true);
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.error(err.response?.data?.message || err.message);
      }
      setIsFetchingChats(false);
    },
    [chats.length, isEndOfChats, isFetchingChats, searchKeywords, user.authToken, user.id],
  );

  const fetchProjects = useCallback(async () => {
    if (!user?.authToken || isFetchingProjects) return;
    setIsFetchingProjects(true);
    try {
      const requestParams = {
        authToken: user.authToken,
        limit: DEFAULT_PROJECT_LIMIT,
        keywords: searchKeywords,
        isSaved: true,
      };
      const res = await BuilderPalApi.getProjects(requestParams);
      setProjects(res.data?.projects);
      setProjectCount(res.data?.count);
    } catch (err) {
      console.error(err);
    }
    setIsFetchingProjects(false);
  }, [isFetchingProjects, searchKeywords, user.authToken]);

  useEffect(() => {
    fetchChats(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeywords]);

  useEffect(() => {
    if (searchKeywords) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeywords]);

  const flatListRenderItem = useCallback(
    ({ item }: { item: Chat }) => (
      <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate('BuilderPalChatScreen', { chatId: item.id })} activeOpacity={0.8}>
        <MyText style={styles.chatItemText}>{item.title || '(No Title)'}</MyText>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeaderContainer}>
        <View style={[styles.searchHeader, { backgroundColor: Colors[colorScheme].contentBackground }]}>
          <View style={styles.searchBar}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: Colors[colorScheme].textInput, color: Colors[colorScheme].text }]}
              placeholder="Search"
              onChangeText={setSearchKeywords}
              value={searchKeywords}
              returnKeyType="done"
              placeholderTextColor="#666"
            />
            <Ionicons style={styles.iconStyle} name="ios-search-outline" size={15} color={Colors[colorScheme].text} />
            {searchKeywords.length > 0 && (
              <TouchableOpacity style={styles.clearSearch} onPress={() => setSearchKeywords('')}>
                <Ionicons name="ios-close" size={15} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {chats.length > 0 && (
          <MyText style={styles.chatListTitle}>
            {t('Chats')} ({chatCount})
          </MyText>
        )}
      </View>
    ),
    [chatCount, chats.length, colorScheme, searchKeywords, t],
  );

  const ListFooterComponent = useMemo(
    () => (
      <View style={styles.listFooterContainer}>
        {projects.length > 0 && (
          <>
            <MyText style={styles.chatListTitle}>
              {t('Favorite Projects')} ({projectCount})
            </MyText>
            {projects.map((v) => (
              <TouchableOpacity
                key={`chat-project_${v.id}`}
                style={styles.chatItem}
                onPress={() => navigation.navigate('BuilderPalProjectScreen', { chatId: v.chatId, chatProjectId: v.id })}
                activeOpacity={0.8}
              >
                <MyText style={styles.chatItemText}>{v.title || '(No Title)'}</MyText>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    ),
    [navigation, projectCount, projects, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
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
          data={chats}
          renderItem={flatListRenderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          onEndReached={() => fetchChats(false)}
          keyExtractor={(item: Chat) => `builderPal-chat_${item.id}`}
          refreshing={isFetchingChats}
          contentContainerStyle={{ width: Layout.screen.width, padding: 18 }}
          ListHeaderComponentStyle={{ width: '100%' }}
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
  },
  chatListTitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 24,
  },
  searchHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    height: 35,
  },
  iconStyle: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  clearSearch: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  searchInput: {
    paddingLeft: 30,
    paddingRight: 10,
    width: '100%',
    height: '100%',
    borderRadius: 17.5,
    backgroundColor: '#f2f2f2',
  },
  listFooterContainer: {
    width: '100%',
    marginBottom: 36,
  },
  listContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  chatItem: {
    marginVertical: 12,
    paddingHorizontal: 1,
  },
  chatItemText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    textAlignVertical: 'center',
  },
});
