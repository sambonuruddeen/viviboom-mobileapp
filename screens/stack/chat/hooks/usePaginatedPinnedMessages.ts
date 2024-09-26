import { useCallback, useEffect, useRef, useState } from 'react';
import type { Channel, MessageResponse } from 'stream-chat';
import { useChatContext } from 'stream-chat-expo';

import type { StreamChatGenerics } from '../types';
import { DEFAULT_PAGINATION_LIMIT } from '../utils/constants';

// eslint-disable-next-line import/prefer-default-export
export const usePaginatedPinnedMessages = (channel: Channel<StreamChatGenerics>) => {
  const { chatClient } = useChatContext();
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | boolean>(false);
  const [messages, setMessages] = useState<MessageResponse<StreamChatGenerics>[]>([]);

  const fetchPinnedMessages = useCallback(async () => {
    if (queryInProgress.current) {
      return;
    }

    setLoading(true);

    try {
      queryInProgress.current = true;

      offset.current += messages.length;

      if (!hasMoreResults.current) {
        queryInProgress.current = false;
        return;
      }

      const res = await chatClient?.search(
        {
          cid: { $in: [channel.cid] },
        },
        { pinned: true },
        {
          limit: DEFAULT_PAGINATION_LIMIT,
          offset: offset.current,
        },
      );

      const newMessages = res?.results.map((r) => r.message);

      if (!newMessages) {
        queryInProgress.current = false;
        return;
      }

      setMessages((existingMessages) => existingMessages.concat(newMessages));

      if (newMessages.length < DEFAULT_PAGINATION_LIMIT) {
        hasMoreResults.current = false;
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
    }
    queryInProgress.current = false;
    setLoading(false);
  }, [channel.cid, chatClient, messages.length]);

  const loadMore = () => {
    fetchPinnedMessages();
  };

  useEffect(() => {
    fetchPinnedMessages();
  }, []);

  return {
    error,
    loading,
    loadMore,
    messages,
  };
};
