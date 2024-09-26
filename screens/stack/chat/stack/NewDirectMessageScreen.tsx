import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Channel as StreamChatChannel } from 'stream-chat';
import { Channel, Group, MessageInput, MessageList, User, UserAdd, useTheme } from 'stream-chat-expo';

import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import { NewDirectMessagingSendButton } from '../components/NewDirectMessagingSendButton';
import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectedUserTag } from '../components/UserSearch/SelectedUserTag';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { useChatContext } from '../context/ChatContext';
import { useUserSearchContext } from '../context/UserSearchContext';
import type { ChatRootStackScreenProps, StreamChatGenerics } from '../types';

const EmptyMessagesIndicator = () => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();
  return (
    <View style={styles.emptyMessageContainer}>
      <Text
        style={[
          styles.noChats,
          {
            color: grey,
          },
        ]}
      >
        No chats here yet...
      </Text>
    </View>
  );
};

export default function NewDirectMessagingScreen({ navigation }: ChatRootStackScreenProps<'NewDirectMessagingScreen'>) {
  const institutionId = useReduxStateSelector((state) => state.account.institutionId);
  const team = institutionId > 1 ? String(institutionId) : undefined;

  const {
    theme: {
      colors: { accent_blue, black, border, grey, white },
    },
  } = useTheme();
  const { chatClient } = useChatContext();

  const { onChangeSearchText, onFocusInput, reset, results, searchText, selectedUserIds, selectedUsers, toggleUser } = useUserSearchContext();

  const messageInputRef = useRef<TextInput | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [currentChannel, setCurrentChannel] = useState<StreamChatChannel<StreamChatGenerics>>();
  const [isLoading, setLoading] = useState(false);
  const [focusOnMessageInput, setFocusOnMessageInput] = useState(false);
  const [focusOnSearchInput, setFocusOnSearchInput] = useState(true);
  // As we don't use the state value, we can omit it here and separate it with a comma within the array.
  const [, setMessageInputText] = useState('');

  // When selectedUsers are changed, initiate a channel with those users as members,
  // and set it as a channel on current screen.
  const selectedUsersLength = selectedUsers?.length || 0;

  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient?.user?.id) return;

      // If there are no selected users, then set dummy channel.
      if (selectedUsersLength === 0) {
        setFocusOnMessageInput(false);
        return;
      }

      setLoading(true);
      setFocusOnMessageInput(false);

      const members = [chatClient.user.id, ...selectedUserIds];

      // Check if the channel already exists.
      const channels = await chatClient.queryChannels({
        distinct: true,
        members,
      });

      if (channels.length === 1) {
        // Channel already exist
        await channels[0].watch();

        setCurrentChannel(channels[0]);
      } else {
        // Channel doesn't exist.
        const channel = chatClient.channel('messaging', {
          members,
          team,
        });

        await channel.watch();

        setCurrentChannel(channel);
      }
      setLoading(false);

      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
      setFocusOnMessageInput(true);
    };

    initChannel();
  }, [chatClient, selectedUserIds, selectedUsersLength, team]);

  useEffect(
    () => () => {
      reset();
    },
    [],
  );

  const renderUserSearch = ({ inSafeArea }: { inSafeArea: boolean }) => (
    <View style={[{ backgroundColor: white }, focusOnSearchInput ? styles.container : undefined]}>
      <ScreenHeader inSafeArea={inSafeArea} onBack={reset} titleText="New Chat" />
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          setFocusOnMessageInput(false);
          setFocusOnSearchInput(true);
          messageInputRef.current?.blur();
          searchInputRef.current?.focus();
        }}
        style={[
          styles.searchContainer,
          {
            backgroundColor: white,
            borderBottomColor: border,
          },
        ]}
      >
        <Text
          style={[
            styles.searchContainerLeft,
            {
              color: grey,
            },
          ]}
        >
          TO:
        </Text>
        <View style={styles.searchContainerMiddle}>
          <View style={styles.selectedUsersContainer}>
            {selectedUsers?.map((tag, index) => {
              const tagProps = {
                disabled: !focusOnSearchInput,
                index,
                onPress: () => {
                  toggleUser(tag);
                },
                tag,
              };

              return <SelectedUserTag key={index} {...tagProps} />;
            })}
          </View>
          {focusOnSearchInput && (
            <View style={styles.inputBoxContainer}>
              <TextInput
                onChangeText={onChangeSearchText}
                onFocus={onFocusInput}
                placeholder="Type a name"
                placeholderTextColor={grey}
                ref={searchInputRef}
                style={[
                  styles.inputBox,
                  {
                    color: black,
                    paddingBottom: selectedUsersLength ? 16 : 0,
                  },
                ]}
                value={searchText}
              />
            </View>
          )}
        </View>
        <View style={styles.searchContainerRight}>{selectedUsersLength === 0 ? <User pathFill={grey} /> : <UserAdd pathFill={grey} />}</View>
      </TouchableOpacity>
      {focusOnSearchInput && !searchText && selectedUsersLength === 0 && (
        <TouchableOpacity
          onPress={() => {
            navigation.push('NewGroupChannelAddMemberScreen');
          }}
          style={styles.createGroupButtonContainer}
        >
          <RoundButton disabled>
            <Group pathFill={accent_blue} />
          </RoundButton>
          <Text
            style={[
              styles.createGroupButtonText,
              {
                color: black,
              },
            ]}
          >
            Create a Group
          </Text>
        </TouchableOpacity>
      )}
      {results && focusOnSearchInput && (
        <UserSearchResults
          toggleSelectedUser={(user) => {
            setFocusOnSearchInput(false);
            toggleUser(user);
          }}
        />
      )}
    </View>
  );

  if (!chatClient) return null;

  if (!currentChannel) {
    return renderUserSearch({ inSafeArea: false });
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: white,
        },
      ]}
    >
      <Channel<StreamChatGenerics>
        key={currentChannel.id}
        additionalTextInputProps={{
          onFocus: () => {
            setFocusOnMessageInput(true);
            setFocusOnSearchInput(false);
            if (messageInputRef.current) {
              messageInputRef.current.focus();
            }
          },
        }}
        channel={currentChannel}
        EmptyStateIndicator={EmptyMessagesIndicator}
        enforceUniqueReaction
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
        onChangeText={setMessageInputText}
        overrideOwnCapabilities={{ sendMessage: true }}
        SendButton={NewDirectMessagingSendButton}
        setInputRef={(ref) => (messageInputRef.current = ref)}
      >
        {renderUserSearch({ inSafeArea: true })}
        {isLoading && <ActivityIndicator style={{ margin: 32 }} />}
        {results && results.length >= 0 && !focusOnSearchInput && focusOnMessageInput && !isLoading && <MessageList />}
        {selectedUsers.length > 0 && !isLoading && <MessageInput />}
      </Channel>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createGroupButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  createGroupButtonText: {
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 8,
  },
  emptyMessageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  inputBox: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingRight: 16,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  inputBoxContainer: {
    flexDirection: 'row',
  },
  noChats: { fontSize: 12 },
  searchContainer: {
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  searchContainerLeft: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    textAlignVertical: 'center',
  },
  searchContainerMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  searchContainerRight: {
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingRight: 16,
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  headerBtn: {
    padding: 11,
    marginTop: 1,
  },
});
