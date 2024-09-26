/* eslint-disable indent */
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSchemeName, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import Colors from 'rn-viviboom/constants/Colors';
import MemberListItem from 'rn-viviboom/hoc/MemberListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const SearchCollaboratorModalColors: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    textInput: '#fff',
  },
  dark: {
    textInput: '#333',
  },
};

const DEFAULT_MEMBER_REQUEST_COUNT = 10;

interface SearchCollaboratorModalProps {
  show: boolean;
  authorUsers: User[];
  handleClose: () => void;
  onAddCollaborator: (author: User) => void;
}

export default function SearchCollaboratorModal({ show, authorUsers, handleClose, onAddCollaborator }: SearchCollaboratorModalProps) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const authToken = useReduxStateSelector((s) => s.account?.authToken);
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>();
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [members, setMembers] = useState<User[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isEndOfMembers, setIsEndOfMembers] = useState(false);

  const fetchMembers = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingMembers) return;
      if (!hardRefresh && isEndOfMembers) return;
      if (hardRefresh) setIsEndOfMembers(false);
      setIsFetchingMembers(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_MEMBER_REQUEST_COUNT,
        offset: hardRefresh ? 0 : members.length,
        username: searchKeyword || undefined,
        orderKey: 'givenName',
        orderDirection: 'ASC',
      };

      try {
        const res = await UserApi.getList(requestParams);
        if (hardRefresh) {
          setMembers(res.data.users);
        } else {
          setMembers([...members, ...res.data.users]);
        }
        if (res.data.users.length < DEFAULT_MEMBER_REQUEST_COUNT) {
          setIsEndOfMembers(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingMembers(false);
    },
    [authToken, isEndOfMembers, isFetchingMembers, members, searchKeyword],
  );

  useEffect(() => {
    const init = () => {
      fetchMembers(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword]);

  const onCancel = useCallback(() => {
    inputRef.current?.blur();
    handleClose();
  }, [handleClose]);

  const onSelect = useCallback(
    (author: User) => () => {
      inputRef.current?.blur();
      onAddCollaborator(author);
      handleClose();
    },
    [onAddCollaborator, handleClose],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const flatListRenderItem = useCallback(
    ({ item }: { item: User }) => (
      <>
        {!authorUsers.find((v) => v.id === item.id) ? (
          <View style={{ backgroundColor: Colors[colorScheme].contentBackground, margin: 12 }}>
            <MemberListItem id={item.id} preloadedData={item} onPress={onSelect(item)} hideLine showUsername />
          </View>
        ) : (
          <View />
        )}
      </>
    ),
    [authorUsers, colorScheme, onSelect],
  );

  return (
    <Modal animationType="slide" transparent visible={show} hardwareAccelerated onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <View
          style={[
            styles.searchHeader,
            { paddingTop: insets.top, height: styles.searchHeader.height + insets.top, backgroundColor: Colors[colorScheme].secondaryBackground },
          ]}
        >
          <View style={styles.searchBar}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: SearchCollaboratorModalColors[colorScheme].textInput, color: Colors[colorScheme].text }]}
              placeholder="Search"
              ref={inputRef}
              onChangeText={setSearchKeyword}
              placeholderTextColor="#aaa"
              returnKeyType="search"
              autoFocus
            />
            <Ionicons style={styles.iconStyle} name="ios-search-outline" size={15} color="#aaa" />
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <MyText style={{ fontSize: 16, fontWeight: '400', letterSpacing: 1, color: Colors[colorScheme].tint }}>Cancel</MyText>
          </TouchableOpacity>
        </View>
        <FlatList
          ListFooterComponent={
            !isEndOfMembers ? null : (
              <MyText style={styles.noItemFoundText}>{!isFetchingMembers && !members.length ? 'No result found' : 'Yay! You have seen it all!'}</MyText>
            )
          }
          data={members}
          renderItem={flatListRenderItem}
          onEndReached={() => fetchMembers(false)}
          keyExtractor={(item) => `member-result_${item.id}`}
          keyboardShouldPersistTaps="always"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    height: 45,
  },
  searchBar: {
    flex: 1,
    marginLeft: 15,
    height: 35,
  },
  iconStyle: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  searchInput: {
    paddingLeft: 30,
    paddingRight: 10,
    width: '100%',
    height: '100%',
    borderRadius: 17.5,
    backgroundColor: '#f2f2f2',
  },
  cancelButton: {
    height: 35,
    width: '20%',
    borderColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
});
