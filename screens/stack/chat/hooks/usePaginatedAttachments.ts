import { useCallback, useEffect, useRef, useState } from 'react';
import type { Channel, MessageResponse } from 'stream-chat';

import { useChatContext } from '../context/ChatContext';
import type { StreamChatGenerics } from '../types';

// eslint-disable-next-line import/prefer-default-export
export const usePaginatedAttachments = (channel: Channel<StreamChatGenerics>, attachmentType: string) => {
  const { chatClient } = useChatContext();
  const offset = useRef(0);
  const hasMoreResults = useRef(true);
  const queryInProgress = useRef(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageResponse<StreamChatGenerics>[]>([]);

  const fetchAttachments = useCallback(async () => {
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

      // TODO: Use this when support for attachment_type is ready.
      const res = await chatClient?.search(
        {
          cid: { $in: [channel.cid] },
        },
        { 'attachments.type': { $in: [attachmentType] } },
        {
          limit: 10,
          offset: offset.current,
        },
      );

      const newMessages = res?.results.map((r) => r.message);

      if (!newMessages) {
        queryInProgress.current = false;
        return;
      }

      setMessages((existingMessages) => existingMessages.concat(newMessages));

      if (newMessages.length < 10) {
        hasMoreResults.current = false;
      }
    } catch (e) {
      // do nothing;
    }
    queryInProgress.current = false;
    setLoading(false);
  }, [attachmentType, channel.cid, chatClient, messages.length]);

  const loadMore = () => {
    fetchAttachments();
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  return {
    loading,
    loadMore,
    messages,
  };
};
