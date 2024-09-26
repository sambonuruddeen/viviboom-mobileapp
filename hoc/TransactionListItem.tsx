import { DateTime } from 'luxon';
import { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Colors from 'rn-viviboom/constants/Colors';
import { TransactionType } from 'rn-viviboom/enums/TransactionType';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyText from './MyText';

interface IProps {
  id?: number;
  preloadedData: Transaction;
}

const TransactionListItem = memo(({ id, preloadedData }: IProps) => {
  const colorScheme = useColorScheme();
  const [transaction, setTransaction] = useState<Transaction>(preloadedData);
  const loggedInUserId = useReduxStateSelector((state) => state.account?.id);

  const isSender = loggedInUserId === transaction?.senderWallet?.userId;
  const isReceiver = loggedInUserId === transaction?.receiverWallet?.userId;

  const userTransferTitle = useMemo(() => {
    let title = `${transaction?.type as string}` || '';
    if (transaction.type === TransactionType.USER_TRANSFER && transaction.senderWallet && transaction.receiverWallet) {
      if (isSender) {
        title = `Sent to ${transaction.receiverWallet?.user?.username}`;
      } else if (isReceiver) {
        title = `Received from ${transaction.senderWallet?.user?.username}`;
      }
    } else if (transaction.type === TransactionType.SYSTEM_AWARD) {
      title = 'Claimed from reward';
    }
    return title;
  }, [isReceiver, isSender, transaction]);

  return (
    <View style={{ ...styles.transactionContainer, backgroundColor: Colors[colorScheme].background }}>
      <View style={styles.titleContainer}>
        <MyText style={styles.receiverName}>{userTransferTitle}</MyText>
        {transaction.description && transaction.type !== TransactionType.SYSTEM_AWARD && (
          <MyText style={{ ...styles.transactionDesc, color: Colors[colorScheme].textSecondary }}>
            {isSender ? 'You' : transaction.senderWallet?.user?.username || ''}: {transaction.description}
          </MyText>
        )}
        <MyText style={styles.transactionDate}>{DateTime.fromJSDate(new Date(transaction?.createdAt)).toLocaleString(DateTime.DATETIME_MED)}</MyText>
      </View>
      {transaction.senderWallet && loggedInUserId === transaction?.senderWallet.userId ? (
        <MyText style={{ ...styles.transactionAmount, color: 'red' }}>-{transaction.amount}</MyText>
      ) : (
        <MyText style={{ ...styles.transactionAmount, color: '#39D951' }}>+{transaction?.amount}</MyText>
      )}
    </View>
  );
});

export default TransactionListItem;

const styles = StyleSheet.create({
  transactionContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#fff',
    padding: 18,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  receiverName: {
    fontSize: 18,
  },
  transactionDesc: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '400',
  },
  transactionDate: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 18,
  },
});
