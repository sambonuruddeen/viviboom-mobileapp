import React, { useEffect } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowRight, Search, useTheme } from 'stream-chat-expo';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import { ScreenHeader } from '../components/ScreenHeader';
import { UserGridItem } from '../components/UserSearch/UserGridItem';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { useChatContext } from '../context/ChatContext';
import { useUserSearchContext } from '../context/UserSearchContext';
import type { ChatRootStackScreenProps } from '../types';

type RightArrowButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

const RightArrowButton: React.FC<RightArrowButtonProps> = (props) => {
  const { disabled, onPress } = props;

  const {
    theme: {
      colors: { accent_blue },
    },
  } = useTheme();

  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={styles.navigationButton}>
      <ArrowRight pathFill={disabled ? 'transparent' : accent_blue} />
    </TouchableOpacity>
  );
};

export default function NewGroupChannelAddMemberScreen({ navigation }: ChatRootStackScreenProps<'NewGroupChannelAddMemberScreen'>) {
  const colorScheme = useColorScheme();
  const { chatClient } = useChatContext();

  const {
    theme: {
      colors: { black, border, grey, white },
    },
  } = useTheme();

  const { onChangeSearchText, onFocusInput, removeUser, reset, searchText, selectedUsers } = useUserSearchContext();

  const onRightArrowPress = () => {
    if (!selectedUsers?.length) return;
    navigation.navigate('NewGroupChannelAssignNameScreen');
  };

  if (!chatClient) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        onBack={reset}
        RightContent={() => <RightArrowButton disabled={selectedUsers.length === 0} onPress={onRightArrowPress} />}
        titleText="Add Group Members"
      />
      <View>
        <View
          style={[
            styles.inputBoxContainer,
            {
              backgroundColor: white,
              borderColor: border,
              marginBottom: !selectedUsers?.length ? 8 : 16,
            },
          ]}
        >
          <Search pathFill={black} />
          <TextInput
            onChangeText={onChangeSearchText}
            onFocus={onFocusInput}
            placeholder="Search"
            placeholderTextColor={grey}
            style={[
              styles.inputBox,
              {
                color: black,
              },
            ]}
            value={searchText}
          />
        </View>
        <FlatList
          data={selectedUsers || []}
          horizontal
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ index, item: user }) => (
            <View style={styles.userGridItemContainer}>
              <UserGridItem
                onPress={() => {
                  removeUser(index);
                }}
                user={user}
              />
            </View>
          )}
          style={selectedUsers?.length ? styles.flatList : {}}
        />
      </View>
      <UserSearchResults />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: { paddingBottom: 16 },
  inputBox: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingHorizontal: 16,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  inputBoxContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  navigationButton: {
    paddingRight: 8,
  },
  userGridItemContainer: { marginHorizontal: 8, width: 64 },
});
