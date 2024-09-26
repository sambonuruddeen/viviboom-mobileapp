/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chat, OverlayProvider, ThemeProvider } from 'stream-chat-expo';
import ModalScreen from 'rn-viviboom/screens/stack/ModalScreen';
import NotFoundScreen from 'rn-viviboom/screens/stack/NotFoundScreen';

import ChatBottomTabNavigator from './ChatBottomTabNavigator';
import { useChatContext } from './context/ChatContext';
import { ChatOverlayProvider } from './context/ChatOverlayProvider';
import { UserSearchProvider } from './context/UserSearchContext';
import { useStreamChatTheme } from './hooks/useStreamChatTheme';
import ChannelFilesScreen from './stack/ChannelFilesScreen';
import ChannelImagesScreen from './stack/ChannelImagesScreen';
import ChannelPinnedMessagesScreen from './stack/ChannelPinnedMessagesScreen';
import ChannelScreen from './stack/ChannelScreen';
import GroupChannelDetailsScreen from './stack/GroupChannelDetailsScreen';
import NewDirectMessagingScreen from './stack/NewDirectMessageScreen';
import NewGroupChannelAddMemberScreen from './stack/NewGroupChannelAddMemberScreen';
import NewGroupChannelAssignNameScreen from './stack/NewGroupChannelAssignNameScreen';
import OneOnOneChannelDetailScreen from './stack/OneOnOneChannelDetailScreen';
import SharedGroupsScreen from './stack/SharedGroupsScreen';
import ThreadScreen from './stack/ThreadScreen';
import { ChatRootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef();

/**
 * Chat app implementation referenced from https://github.com/GetStream/stream-chat-react-native/tree/develop/examples/SampleApp
 */
const Stack = createNativeStackNavigator<ChatRootStackParamList>();

export default function ChatRootNavigator() {
  const insets = useSafeAreaInsets();
  const theme = useStreamChatTheme();
  const { chatClient } = useChatContext();

  return !chatClient ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  ) : (
    <ThemeProvider style={theme}>
      <OverlayProvider bottomInset={insets.bottom} translucentStatusBar value={{ style: theme }}>
        <Chat client={chatClient}>
          <ChatOverlayProvider>
            <UserSearchProvider>
              <Stack.Navigator>
                <Stack.Screen name="ChatRoot" component={ChatBottomTabNavigator} options={{ headerShown: false }} />
                <Stack.Screen name="ChannelScreen" component={ChannelScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ChannelFilesScreen" component={ChannelFilesScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ChannelImagesScreen" component={ChannelImagesScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ChannelPinnedMessagesScreen" component={ChannelPinnedMessagesScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ThreadScreen" component={ThreadScreen} options={{ headerShown: false }} />
                <Stack.Screen name="NewDirectMessagingScreen" component={NewDirectMessagingScreen} options={{ headerShown: false }} />
                <Stack.Screen name="NewGroupChannelAddMemberScreen" component={NewGroupChannelAddMemberScreen} options={{ headerShown: false }} />
                <Stack.Screen name="NewGroupChannelAssignNameScreen" component={NewGroupChannelAssignNameScreen} options={{ headerShown: false }} />
                <Stack.Screen name="OneOnOneChannelDetailScreen" component={OneOnOneChannelDetailScreen} options={{ headerShown: false }} />
                <Stack.Screen name="GroupChannelDetailsScreen" component={GroupChannelDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="SharedGroupsScreen" component={SharedGroupsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
                <Stack.Group screenOptions={{ presentation: 'modal' }}>
                  <Stack.Screen name="Modal" component={ModalScreen} />
                </Stack.Group>
              </Stack.Navigator>
            </UserSearchProvider>
          </ChatOverlayProvider>
        </Chat>
      </OverlayProvider>
    </ThemeProvider>
  );
}
