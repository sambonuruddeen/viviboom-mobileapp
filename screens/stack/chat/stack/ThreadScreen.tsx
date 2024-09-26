import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Channel, Thread, ThreadContextValue, useAttachmentPickerContext, useTypingString } from 'stream-chat-expo';

import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import { ScreenHeader } from '../components/ScreenHeader';
import { ChatRootStackScreenProps, StreamChatGenerics } from '../types';

type ThreadHeaderProps = {
  thread: ThreadContextValue<StreamChatGenerics>['thread'];
};

const ThreadHeader: React.FC<ThreadHeaderProps> = ({ thread }) => {
  const typing = useTypingString();

  return <ScreenHeader subtitleText={typing || `with ${thread?.user?.name}`} titleText="Thread Reply" />;
};

export default function ThreadScreen({ navigation, route }: ChatRootStackScreenProps<'ThreadScreen'>) {
  const colorScheme = useColorScheme();
  const headerHeight = useHeaderHeight();
  const { setTopInset, setSelectedImages } = useAttachmentPickerContext();

  useEffect(() => {
    setTopInset(headerHeight);
  }, [headerHeight, setTopInset]);

  useEffect(() => {
    setSelectedImages([]);
    return () => setSelectedImages([]);
  }, []);

  return (
    <View style={styles.container}>
      <Channel channel={route.params.channel} keyboardVerticalOffset={headerHeight} thread={route.params.thread} threadList>
        <View
          style={{
            flex: 1,
            width: Layout.screen.width,
            justifyContent: 'flex-start',
          }}
        >
          <ThreadHeader thread={route.params.thread} />
          <Thread />
        </View>
      </Channel>
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
