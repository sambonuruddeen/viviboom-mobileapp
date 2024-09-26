import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';
import Colors from 'rn-viviboom/constants/Colors';
import { TransactionOrderType } from 'rn-viviboom/enums/TransactionOrderType';
import { TransactionRoleType } from 'rn-viviboom/enums/TransactionRoleType';
import { TransactionType } from 'rn-viviboom/enums/TransactionType';
import MyText from 'rn-viviboom/hoc/MyText';
import TransactionListItem from 'rn-viviboom/hoc/TransactionListItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const DEFAULT_TRANSACTION_REQUEST_COUNT = 10;

const filters = [
  { id: 1, label: 'Latest', key: 'Latest', params: { order: TransactionOrderType.LATEST } },
  { id: 2, label: 'Oldest', key: 'Oldest', params: { order: TransactionOrderType.OLDEST } },
  { id: 3, label: 'Sent', key: 'Sender', params: { role: TransactionRoleType.SENDER } },
  { id: 4, label: 'Received', key: 'Receiver', params: { role: TransactionRoleType.RECEIVER } },
  { id: 5, label: 'Transfers', key: 'User Transfer', params: { type: TransactionType.USER_TRANSFER } },
  { id: 6, label: 'Rewards', key: 'System Award', params: { type: TransactionType.SYSTEM_AWARD } },
];
interface filterKeyParams {
  id: number;
  label: string;
  key: string;
  params: { order: string };
}

export default function TransactionListScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const [transactionFilterKey, setTransactionFilterKey] = useState('Latest');
  const [transactions, setTransactions] = useState<Array<Transaction>>([]);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
  const [isEndOfTransactions, setIsEndOfTransactions] = useState(false);

  const fetchTransactions = useCallback(
    async (filter, hardRefresh = false) => {
      if (isFetchingTransactions) return;
      if (!hardRefresh && isEndOfTransactions) return;
      if (hardRefresh) setIsEndOfTransactions(false);
      setIsFetchingTransactions(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_TRANSACTION_REQUEST_COUNT,
        offset: hardRefresh ? 0 : transactions.length,
        ...(filters.find((f) => f.key === filter).params || {}),
        verboseAttributes: ['users'],
      };

      try {
        const res = await VivicoinApi.getTransactionList(requestParams);
        if (hardRefresh) {
          setTransactions(res.data.transactions);
        } else {
          setTransactions([...transactions, ...res.data.transactions]);
        }

        // check if end of list
        if (res.data.transactions.length < DEFAULT_TRANSACTION_REQUEST_COUNT) {
          setIsEndOfTransactions(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingTransactions(false);
    },
    [isFetchingTransactions, isEndOfTransactions, authToken, transactions],
  );

  useEffect(() => {
    const init = async () => {
      await fetchTransactions(transactionFilterKey, true);
    };
    init();
  }, [transactionFilterKey]);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: 'My Transactions',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  const flatListRenderItem = ({ item }: { item: Transaction }) => (
    <View style={{ marginHorizontal: 18 }}>
      <TransactionListItem id={item.id} preloadedData={item} />
    </View>
  );

  const changeFilterKey = async (item: filterKeyParams) => {
    setTransactionFilterKey(item.key);
    await fetchTransactions(item.key, true);
  };

  const header = () => (
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {filters.map((item: filterKeyParams) => (
        <TouchableOpacity
          key={item.id}
          style={{
            ...styles.filterButton,
            backgroundColor: transactionFilterKey === item.key ? Colors[colorScheme].tint : Colors[colorScheme].background,
            borderColor: transactionFilterKey === item.key ? Colors[colorScheme].background : Colors[colorScheme].tint,
          }}
          onPress={() => changeFilterKey(item)}
        >
          <MyText style={{ color: transactionFilterKey === item.key ? Colors[colorScheme].textInverse : Colors[colorScheme].tint }}>{item.label}</MyText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Animated.FlatList
      ListHeaderComponent={header}
      ListFooterComponent={
        !isEndOfTransactions ? null : (
          <MyText style={styles.noItemFoundText}>
            {t(!isFetchingTransactions && !transactions.length ? 'No Recent Transactions' : 'Yay! You have seen it all!')}
          </MyText>
        )
      }
      data={transactions}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchTransactions(transactionFilterKey, false)}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  noItemFoundText: {
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
    paddingHorizontal: 18,
    width: 'auto',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 50,
  },
});
