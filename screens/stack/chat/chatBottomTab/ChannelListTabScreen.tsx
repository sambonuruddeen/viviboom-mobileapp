import { useScrollToTop } from '@react-navigation/native';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Channel } from 'stream-chat';
import { ChannelList, CircleClose, Search, useTheme } from 'stream-chat-expo';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { useChatContext } from '../context/ChatContext';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import { ChatRootTabScreenProps } from '../types';

const filters = {};
const sort = { last_message_at: -1 };
const options = {
  state: true,
  watch: true,
};

export default function ChannelListTabScreen({ navigation }: ChatRootTabScreenProps<'ChannelListTabScreen'>) {
  const { chatClient } = useChatContext();
  const {
    theme: {
      colors: { black, grey, grey_gainsboro, grey_whisper, white },
    },
  } = useTheme();

  const searchInputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<FlatList<Channel> | null>(null);

  const [searchInputText, setSearchInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { loading, loadMore, messages, refreshing, refreshList, reset } = usePaginatedSearchedMessages(searchQuery);

  const chatClientUserId = chatClient?.user?.id;
  const memoizedFilters = useMemo(
    () => ({
      ...filters,
      members: {
        $in: [chatClientUserId],
      },
    }),
    [chatClientUserId],
  );

  useScrollToTop(scrollRef);

  const EmptySearchIndicator = () => (
    <View style={styles.emptyIndicatorContainer}>
      <Search height={112} pathFill={grey_gainsboro} width={112} />
      <Text style={[styles.emptyIndicatorText, { color: grey }]}>{`No results for "${searchQuery}"`}</Text>
    </View>
  );

  const setScrollRef = (ref: React.RefObject<FlatList<Channel> | null>) => {
    scrollRef.current = ref;
  };

  return (
    <View style={styles.container}>
      <ChatScreenHeader title="Chats" />
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: white,
            borderColor: grey_whisper,
          },
        ]}
      >
        <Search pathFill={black} />
        <TextInput
          onChangeText={(text) => {
            setSearchInputText(text);
            if (!text) {
              reset();
              setSearchQuery('');
            }
          }}
          onSubmitEditing={({ nativeEvent: { text } }) => {
            setSearchQuery(text);
          }}
          placeholder="Search"
          placeholderTextColor={grey}
          ref={searchInputRef}
          returnKeyType="search"
          style={[styles.searchInput, { color: black }]}
          value={searchInputText}
        />
        {!!searchInputText && (
          <TouchableOpacity
            onPress={() => {
              setSearchInputText('');
              setSearchQuery('');
              if (searchInputRef.current) {
                searchInputRef.current.blur();
              }
              reset();
            }}
          >
            <CircleClose pathFill={grey} />
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flex: 1, width: '100%' }}>
        <View style={{ flex: 1, width: '100%', opacity: searchQuery ? 0 : 1 }}>
          <ChannelList
            filters={memoizedFilters}
            HeaderNetworkDownIndicator={() => null}
            maxUnreadCount={99}
            onSelect={(channel) => {
              navigation.navigate('ChannelScreen', { channel });
            }}
            options={options}
            sort={sort}
            setFlatListRef={setScrollRef}
          />
        </View>
        {(!!searchQuery || (messages && messages.length > 0)) && (
          <View style={StyleSheet.absoluteFill}>
            <MessageSearchList
              EmptySearchIndicator={EmptySearchIndicator}
              loading={loading}
              loadMore={loadMore}
              messages={messages}
              ref={scrollRef}
              refreshing={refreshing}
              refreshList={refreshList}
              showResultCount
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerBtn: {
    padding: 11,
    marginTop: 1,
  },
  channelListContainer: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  emptyIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyIndicatorText: { paddingTop: 28 },
  flex: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingHorizontal: 10,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
});
