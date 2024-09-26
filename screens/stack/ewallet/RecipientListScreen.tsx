import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import { TransactionOrderType } from 'rn-viviboom/enums/TransactionOrderType';
import { TransactionType } from 'rn-viviboom/enums/TransactionType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import RecipientListItem from 'rn-viviboom/hoc/RecipientListItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import WalletReduxActions from 'rn-viviboom/redux/wallet/WalletReduxActions';

const DEFAULT_WALLET_REQUEST_COUNT = 10;
const DEFAULT_PROFILE_IMAGE_SIZE = 256;
const screen = Dimensions.get('screen');

const getRecentUsers = (transactions: Transaction[], loggedInUserId: number) => {
  const transactionUserWallets = transactions.map((transaction) => [transaction.senderWallet, transaction.receiverWallet]).flat(1);
  const transactionUserIds = transactionUserWallets.map((u) => u.userId);
  const recentUserIds = [...new Set(transactionUserIds.flat(1))];
  return recentUserIds
    .map((id) => {
      const w = transactionUserWallets.find((tu) => tu.userId === id);
      return w.user;
    })
    .filter((u) => u.id !== loggedInUserId);
};

export default function RecipientListScreen({ navigation }: RootStackScreenProps<'RecipientListScreen'>) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const loggedInUser = useReduxStateSelector((state) => state.account);
  const [queryType, setQueryType] = useState('username');
  const [queryOrder, setQueryOrder] = useState('ASC');

  const [users, setUsers] = useState<Array<User>>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [isEndOfUsers, setIsEndOfUsers] = useState(false);
  const [searchText, setSearchText] = useState('');
  const recentInteractedUsers = useReduxStateSelector((state) => state.wallet?.[loggedInUser?.id]?.recentInteractedUsers || []);

  const fetchRecentInteractedUsers = useCallback(async () => {
    const transactionRequestParams = {
      authToken: loggedInUser?.authToken,
      order: TransactionOrderType.LATEST,
      type: TransactionType.USER_TRANSFER,
      limit: 10,
      verboseAttributes: ['users'],
    };
    try {
      const transactionRes = await VivicoinApi.getTransactionList(transactionRequestParams);
      if (transactionRes.data.transactions.length > 0) {
        const recentUsers = getRecentUsers(transactionRes.data?.transactions, loggedInUser.id);
        WalletReduxActions.save({ recentInteractedUsers: recentUsers });
      } else {
        WalletReduxActions.save({ recentInteractedUsers: [] });
      }
    } catch (err) {
      console.error(err);
    }
  }, [loggedInUser]);

  const constructSearchParams = useCallback(
    (hardRefresh: boolean) => {
      const params = {
        authToken: loggedInUser?.authToken,
        limit: DEFAULT_WALLET_REQUEST_COUNT,
        offset: hardRefresh ? 0 : users.length,
        orderKey: queryType,
        orderDirection: queryOrder,
        isWalletActivated: true,
        verboseAttributes: ['wallet'],
        isOmitSelf: true,
      };

      if (searchText) {
        params[queryType] = searchText;
      }

      return params;
    },
    [loggedInUser?.authToken, queryOrder, queryType, searchText, users?.length],
  );

  const fetchUsers = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingUsers) return;
      if (!hardRefresh && isEndOfUsers) return;
      if (hardRefresh) setIsEndOfUsers(false);
      const requestParams = constructSearchParams(hardRefresh);
      setIsFetchingUsers(true);

      try {
        const res = await UserApi.getList(requestParams);
        if (hardRefresh) {
          setUsers(res.data.users);
        } else {
          setUsers([...users, ...res.data.users]);
        }

        // check if end of list
        if (res.data.users.length < DEFAULT_WALLET_REQUEST_COUNT) {
          setIsEndOfUsers(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingUsers(false);
    },
    [isFetchingUsers, isEndOfUsers, constructSearchParams, users],
  );

  const flatListRenderItem = ({ item }: { item: User }) => <RecipientListItem key={item.id} preloadedData={item} />;

  useEffect(() => {
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  useEffect(() => {
    fetchRecentInteractedUsers();
  }, [fetchRecentInteractedUsers]);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: 'Contacts',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  const header = useMemo(
    () => (
      <View>
        <View style={styles.searchHeader}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('Search Name of User')}
              value={searchText}
              onChangeText={(text) => setSearchText(text)}
              blurOnSubmit
              onSubmitEditing={() => fetchUsers(true)}
            />
            <Ionicons style={styles.iconStyle} name="ios-search-outline" size={15} color="#666" />
            {searchText && (
              <TouchableOpacity style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }} onPress={() => setSearchText('')}>
                <Ionicons name="ios-close" color="#666" size={22} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {recentInteractedUsers.length > 0 && !searchText && (
          <View style={{ marginVertical: 18 }}>
            <MyText style={{ marginBottom: 12 }}>{t('Recently Interacted')}</MyText>
            <ScrollView horizontal contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
              {recentInteractedUsers.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={{ marginHorizontal: 8, alignItems: 'center' }}
                  onPress={() => navigation.replace('TransactionScreen', { userId: v?.id })}
                >
                  <MyImage style={styles.avatar} uri={v.profileImageUri} params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }} defaultSource={DefaultProfilePicture} />
                  <MyText style={{ marginTop: 8, alignSelf: 'center', fontWeight: '400' }}>{v?.username}</MyText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    ),
    [fetchUsers, navigation, recentInteractedUsers, searchText, t],
  );

  return (
    <FlatList
      style={{ paddingBottom: 12 }}
      ListHeaderComponent={header}
      ListFooterComponent={
        !isEndOfUsers ? null : (
          <MyText style={styles.noItemFoundText}>{t(!isFetchingUsers && !users.length ? 'No wallet found' : 'Yay! You have seen it all!')}</MyText>
        )
      }
      data={users}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchUsers(false)}
      contentContainerStyle={{ width: screen.width, padding: 18 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  searchHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    alignSelf: 'center',
  },
  searchBar: {
    flex: 1,
    height: 38,
  },
  iconStyle: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 46,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 30,
    paddingRight: 10,
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
    borderRadius: 17.5,
    fontSize: 15,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});
