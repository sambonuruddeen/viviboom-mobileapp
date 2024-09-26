import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useChatContext as useStreamChatContext, useTheme } from 'stream-chat-expo';

import { NewDirectMessageIcon } from '../icons/NewDirectMessageIcon';
import { NetworkDownIndicator } from './NetworkDownIndicator';
import { RoundButton } from './RoundButton';
import { BackButton, ScreenHeader } from './ScreenHeader';

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
});

// eslint-disable-next-line import/prefer-default-export
export const ChatScreenHeader: React.FC<{ title?: string }> = ({ title = 'Chat' }) => {
  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

  const navigation = useNavigation();
  const { isOnline } = useStreamChatContext();

  return (
    <ScreenHeader
      LeftContent={() => <BackButton onBack={() => navigation.navigate('Root')} />}
      RightContent={() => (
        <RoundButton onPress={() => navigation.navigate('NewDirectMessagingScreen')}>
          <NewDirectMessageIcon active color={accent_blue} height={25} width={25} />
        </RoundButton>
      )}
      Title={isOnline ? undefined : () => <NetworkDownIndicator titleSize="large" />}
      titleText={title}
    />
  );
};
