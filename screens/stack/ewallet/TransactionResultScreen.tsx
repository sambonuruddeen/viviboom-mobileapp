import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';

import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';
import PaymentSuccess from 'rn-viviboom/assets/images/successful-payment.png';
import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const screen = Dimensions.get('screen');

export default function TransactionResultScreen({ navigation, route }: RootStackScreenProps<'TransactionResultScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const receiverUsername = route.params?.username;
  const transactionId = route.params?.transactionId;
  const [transaction, setTransaction] = useState<Transaction>();

  const fetchTransaction = useCallback(async () => {
    const requestParams = {
      authToken,
      transactionId,
    };
    try {
      const res = await VivicoinApi.getTransaction(requestParams);
      setTransaction(res.data?.transaction);
    } catch (err) {
      console.error(err);
    }
  }, [authToken, transactionId]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  return (
    <ScrollView contentContainerStyle={{ ...styles.container, backgroundColor: Colors[colorScheme].background }}>
      <View style={styles.paymentForm}>
        <Image source={PaymentSuccess} style={styles.giftImage} />
        <MyText style={{ fontSize: 28, textAlign: 'center', color: Colors[colorScheme].tint }}>{t('Payment Successful!')}</MyText>
        <View style={{ marginVertical: 24, width: screen.width, justifyContent: 'flex-start' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', margin: 18 }}>
            <MyText style={{ textAlign: 'center', flex: 1, fontSize: 18, color: Colors[colorScheme].textSecondary }}>{t('Amount Paid')}</MyText>
            <MyText style={{ textAlign: 'center', flex: 1, fontSize: 18, color: Colors[colorScheme].textSecondary }}>{transaction?.amount}</MyText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', margin: 18 }}>
            <MyText style={{ textAlign: 'center', flex: 1, fontSize: 18, color: Colors[colorScheme].textSecondary }}>{t('Paid to')}</MyText>
            <MyText style={{ textAlign: 'center', flex: 1, fontSize: 18, color: Colors[colorScheme].textSecondary }}>{receiverUsername}</MyText>
          </View>
        </View>
        <View style={{ margin: 18 }}>
          <MyButton style={styles.confirmButton} mode="contained" onPress={() => navigation.replace('EWalletScreen')}>
            {t('Done')}
          </MyButton>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentForm: {
    alignItems: 'center',
  },
  giftImage: {
    width: 150,
    height: 150,
    marginVertical: 18,
  },
  confirmButton: {
    borderRadius: 50,
    marginVertical: 18,
    paddingHorizontal: 24,
  },
});
