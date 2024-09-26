/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Channel, UserResponse } from 'stream-chat';
import { ThreadContextValue } from 'stream-chat-expo';

export type LocalAttachmentType = {
  file_size?: number;
  mime_type?: string;
};
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string;
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalReactionType = Record<string, unknown>;
export type LocalUserType = {
  image?: string;
};


export type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

declare global {
  namespace ReactNavigation {
    type ChatRootParamList = ChatRootStackParamList;
  }
}

export type ChatRootTabParamList = {
  ChannelListTabScreen: undefined;
  MentionTabScreen: undefined;
  GroupTabScreen: undefined;
};

export type ChatRootStackParamList = {
  ChatRoot: NavigatorScreenParams<ChatRootTabParamList> | undefined;
  ChannelScreen: { channel?: Channel<StreamChatGenerics>; messageId?: string; channelId?: string; type?: string };
  ChannelFilesScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  ChannelImagesScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  GroupChannelDetailsScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  ChannelPinnedMessagesScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  NewDirectMessagingScreen: undefined;
  NewGroupChannelAddMemberScreen: undefined;
  NewGroupChannelAssignNameScreen: undefined;
  OneOnOneChannelDetailScreen: { channel: Channel<StreamChatGenerics> };
  SharedGroupsScreen: { user: UserResponse<StreamChatGenerics> };
  ThreadScreen: { channel: Channel<StreamChatGenerics>; thread: ThreadContextValue<StreamChatGenerics>['thread'] };
  Modal: undefined;
  NotFound: { title: string };
};

export type ChatRootStackScreenProps<Screen extends keyof ChatRootStackParamList> = NativeStackScreenProps<ChatRootStackParamList, Screen>;

export type ChatRootTabScreenProps<Screen extends keyof ChatRootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<ChatRootTabParamList, Screen>,
  NativeStackScreenProps<ChatRootStackParamList>
>;
