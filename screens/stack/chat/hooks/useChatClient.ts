import { useCallback, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

import ChatApi from 'rn-viviboom/apis/viviboom/ChatApi';
import Config from 'rn-viviboom/constants/Config';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import type { StreamChatGenerics } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const useChatClient = () => {
  const account = useReduxStateSelector((state) => state.account);
  const [chatClient, setChatClient] = useState<StreamChat<StreamChatGenerics> | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>();

  const chatLogin = useCallback(async () => {
    try {
      const res = await ChatApi.getAuthToken({ authToken: account.authToken });
      const { streamChatAuthToken } = res.data;
      const client = StreamChat.getInstance(Config.StreamChatAppKey);
      const connectedUser = await client.connectUser({ id: String(account.id) }, streamChatAuthToken);
      const initialUnreadCount = connectedUser?.me?.total_unread_count;
      setUnreadCount(initialUnreadCount);
      setChatClient(client);
    } catch (err) {
      console.error(err);
    }
  }, [account.authToken, account.id]);

  const chatLogout = useCallback(async () => {
    await chatClient?.disconnectUser();
    setChatClient(null);
  }, [chatClient]);

  // login to chat
  useEffect(() => {
    if (account.authToken && account.institution?.isChatEnabled) chatLogin();
  }, [account?.authToken, account.institution?.isChatEnabled, chatLogin]);

  // clean up
  useEffect(() => {
    if (!account?.authToken) chatLogout();
  }, [account?.authToken, chatLogout]);

  /**
   * Listen to changes in unread counts and update the badge count
   */
  useEffect(() => {
    const listener = chatClient?.on((e) => {
      if (e.total_unread_count !== undefined) {
        setUnreadCount(e.total_unread_count);
      }
    });

    return () => {
      if (listener) {
        listener.unsubscribe();
      }
    };
  }, [chatClient]);

  return {
    chatClient,
    unreadCount,
  };
};
