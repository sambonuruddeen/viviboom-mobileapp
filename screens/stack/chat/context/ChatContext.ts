import React from 'react';

import type { StreamChat } from 'stream-chat';

import type { StreamChatGenerics } from '../types';

type ChatContextType = {
  chatClient: StreamChat<StreamChatGenerics> | null;
  unreadCount: number;
};

export const ChatContext = React.createContext({} as ChatContextType);

export const useChatContext = () => React.useContext(ChatContext);
