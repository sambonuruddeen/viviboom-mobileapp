import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Channel as StreamChatChannel } from 'stream-chat';
import {
  Channel,
  ChannelAvatar,
  MessageInput,
  MessageList,
  NetworkDownIndicator,
  ThreadContextValue,
  useAttachmentPickerContext,
  useChannelPreviewDisplayName,
  useChatContext as useStreamChatContext,
  useTypingString,
} from 'stream-chat-expo';

import Layout from 'rn-viviboom/constants/Layout';

import { ScreenHeader } from '../components/ScreenHeader';
import { useChatContext } from '../context/ChatContext';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';
import { ChatRootStackScreenProps, StreamChatGenerics } from '../types';

type ChannelHeaderProps = {
  channel: StreamChatChannel<StreamChatGenerics>;
};

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
  const { closePicker } = useAttachmentPickerContext();
  const membersStatus = useChannelMembersStatus(channel);
  const displayName = useChannelPreviewDisplayName(channel, 30);
  const { isOnline } = useStreamChatContext();
  const { chatClient } = useChatContext();
  const navigation = useNavigation();
  const typing = useTypingString();

  if (!channel || !chatClient) return null;

  const isOneOnOneConversation = channel && Object.values(channel.state.members).length === 2 && channel.id?.indexOf('!members-') === 0;

  return (
    <ScreenHeader
      RightContent={() => (
        <TouchableOpacity
          onPress={() => {
            closePicker();
            if (isOneOnOneConversation) {
              navigation.navigate('OneOnOneChannelDetailScreen', {
                channel,
              });
            } else {
              navigation.navigate('GroupChannelDetailsScreen', {
                channel,
              });
            }
          }}
        >
          <ChannelAvatar channel={channel} />
        </TouchableOpacity>
      )}
      showUnreadCountBadge
      Subtitle={isOnline ? undefined : NetworkDownIndicator}
      subtitleText={typing || membersStatus}
      titleText={displayName}
    />
  );
};

export default function ChannelScreen({ navigation, route }: ChatRootStackScreenProps<'ChannelScreen'>) {
  const headerHeight = useHeaderHeight();
  const { setTopInset } = useAttachmentPickerContext();
  const { chatClient } = useChatContext();

  const [channel, setChannel] = useState<StreamChatChannel<StreamChatGenerics> | undefined>(route.params.channel);
  const [selectedThread, setSelectedThread] = useState<ThreadContextValue<StreamChatGenerics>['thread']>();

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight, setTopInset]);

  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient || !route.params?.channelId) return;

      const { channelId, type } = route.params;

      const newChannel = chatClient?.channel(type || 'messaging', channelId);
      if (!newChannel?.initialized) {
        await newChannel?.watch();
      }
      setChannel(newChannel);
    };

    initChannel();
  }, [chatClient, route.params, setChannel]);

  return (
    <View style={styles.container}>
      {!!channel && (
        <Channel channel={channel} keyboardVerticalOffset={headerHeight} thread={selectedThread} messageId={route.params?.messageId}>
          <View style={{ flex: 1, width: Layout.screen.width }}>
            <ChannelHeader channel={channel} />
            <MessageList
              onThreadSelect={(thread) => {
                setSelectedThread(thread);
                navigation.navigate('ThreadScreen', { channel, thread });
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      )}
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
});
