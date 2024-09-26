import { useScrollToTop } from '@react-navigation/native';
import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MessageResponse } from 'stream-chat';
import { AtMentions, useTheme } from 'stream-chat-expo';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { useChatContext } from '../context/ChatContext';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import { ChatRootTabScreenProps, StreamChatGenerics } from '../types';

const EmptyMentionsSearchIndicator = () => {
  const {
    theme: {
      colors: { grey, grey_gainsboro },
    },
  } = useTheme();

  return (
    <View style={styles.emptyIndicatorContainer}>
      <AtMentions height={112} pathFill={grey_gainsboro} width={112} />
      <Text style={[styles.emptyIndicatorText, { color: grey }]}>No mentions exist yet...</Text>
    </View>
  );
};

export default function MentionTabScreen({ navigation }: ChatRootTabScreenProps<'MentionTabScreen'>) {
  const {
    theme: {
      colors: { white_snow },
    },
  } = useTheme();
  const { chatClient } = useChatContext();
  const messageFilters = useMemo(
    () => ({
      'mentioned_users.id': {
        $contains: chatClient?.user?.id || '',
      },
    }),
    [chatClient],
  );

  const scrollRef = useRef<FlatList<MessageResponse<StreamChatGenerics>> | null>(null);

  useScrollToTop(scrollRef);

  const { loading, loadMore, messages, refreshing, refreshList } = usePaginatedSearchedMessages(messageFilters);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: white_snow,
        },
      ]}
    >
      <ChatScreenHeader title="Mentions" />
      <MessageSearchList
        EmptySearchIndicator={EmptyMentionsSearchIndicator}
        loading={loading}
        loadMore={loadMore}
        messages={messages}
        ref={scrollRef}
        refreshing={refreshing}
        refreshList={refreshList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyIndicatorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyIndicatorText: {
    fontSize: 14,
    paddingTop: 28,
  },
});
