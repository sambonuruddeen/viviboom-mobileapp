import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChannelFilters, MessageFilters, MessageResponse } from 'stream-chat';

import { useChatContext } from '../context/ChatContext';
import type { StreamChatGenerics } from '../types';
import { DEFAULT_PAGINATION_LIMIT } from '../utils/constants';

// eslint-disable-next-line import/prefer-default-export
export const usePaginatedSearchedMessages = (
  messageFilters: string | MessageFilters<StreamChatGenerics> = {},
  channelFilters: ChannelFilters<StreamChatGenerics> = {},
) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | boolean>(false);
  const [messages, setMessages] = useState<MessageResponse<StreamChatGenerics>[]>();
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const { chatClient } = useChatContext();

  const done = () => {
    queryInProgress.current = false;
    setLoading(false);
    setRefreshing(false);
  };

  const reset = () => {
    setMessages(undefined);
    offset.current = 0;
    hasMoreResults.current = true;
  };

  const fetchMessages = useCallback(async () => {
    if (!messageFilters) {
      reset();
      done();
      return;
    }

    if (queryInProgress.current) {
      done();
      return;
    }

    setLoading(true);

    try {
      queryInProgress.current = true;

      if (!hasMoreResults.current) {
        queryInProgress.current = false;
        done();
        return;
      }

      const res = await chatClient?.search(
        {
          members: {
            $in: [chatClient?.user?.id || null],
          },
          ...channelFilters,
        },
        messageFilters,
        {
          limit: DEFAULT_PAGINATION_LIMIT,
          offset: offset.current,
        },
      );

      const newMessages = res?.results.map((r) => r.message);
      if (!newMessages) {
        queryInProgress.current = false;
        done();
        return;
      }

      let messagesLength = 0;
      if (offset.current === 0) {
        messagesLength = newMessages.length;
        setMessages(newMessages);
      } else {
        setMessages((existingMessages) => {
          if (!existingMessages) {
            messagesLength = newMessages.length;
            return newMessages;
          }

          const returnMessages = existingMessages.concat(newMessages);
          messagesLength = returnMessages.length;
          return returnMessages;
        });
      }

      if (newMessages.length < DEFAULT_PAGINATION_LIMIT) {
        hasMoreResults.current = false;
      }

      offset.current += messagesLength;
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
    }

    done();
  }, [chatClient, messageFilters]);

  const loadMore = () => {
    fetchMessages();
  };

  useEffect(() => {
    reloadList();
  }, [messageFilters]);

  const refreshList = () => {
    if (!chatClient?.user?.id) return;

    offset.current = 0;
    hasMoreResults.current = true;

    setRefreshing(true);
    fetchMessages();
  };

  const reloadList = () => {
    reset();

    setMessages([]);
    fetchMessages();
  };

  return {
    error,
    loading,
    loadMore,
    messages,
    refreshing,
    refreshList,
    reloadList,
    reset,
  };
};
