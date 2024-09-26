import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';
import Vivicoin from 'rn-viviboom/assets/images/v-coin.png';
import Wallet from 'rn-viviboom/assets/images/wallet.png';
import Colors from 'rn-viviboom/constants/Colors';
import { TransactionOrderType } from 'rn-viviboom/enums/TransactionOrderType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import TransactionListItem from 'rn-viviboom/hoc/TransactionListItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import WalletReduxActions from 'rn-viviboom/redux/wallet/WalletReduxActions';

export default function EWalletScreen({ navigation }: RootStackScreenProps<'EWalletScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const loggedInUser = useReduxStateSelector((state) => state.account);
  const wallet = useReduxStateSelector((state) => state.wallet?.[loggedInUser.id]?.wallet);
  const transactions = useReduxStateSelector((state) => state.wallet?.[loggedInUser.id]?.recentTransactions || []);
  const bounceAnimation = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorScheme();

  const bounceAnim = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const fetchTransactions = useCallback(async () => {
    const requestParams = {
      authToken: loggedInUser?.authToken,
      order: TransactionOrderType.LATEST,
      limit: 10,
      verboseAttributes: ['users'],
    };
    try {
      const res = await VivicoinApi.getTransactionList(requestParams);
      WalletReduxActions.save({ recentTransactions: res.data?.transactions });
    } catch (err) {
      console.error(err);
    }
  }, [loggedInUser?.authToken]);

  const createWallet = useCallback(async () => {
    const requestParams = {
      authToken: loggedInUser?.authToken,
      userId: loggedInUser?.id,
    };
    try {
      await VivicoinApi.postWallet(requestParams);
      await WalletReduxActions.fetch();
    } catch (err) {
      console.error(err);
    }
  }, [loggedInUser?.authToken, loggedInUser?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      await WalletReduxActions.fetch();
      await fetchTransactions();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: 'My Wallet',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  useEffect(() => {
    bounceAnim();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#222' : '#EDF1F8' }]} contentContainerStyle={{ padding: 18 }}>
      {wallet ? (
        <>
          <View style={{ ...styles.walletContainer, backgroundColor: Colors[colorScheme].background }}>
            <View style={styles.balance}>
              <View style={styles.balanceContainer}>
                <MyText style={{ fontSize: 40 }}>{wallet?.balance || 0}</MyText>
                <MyText style={{ marginLeft: 12, marginBottom: 12, color: 'gray' }}>{t('VIVICOIN', { count: wallet?.balance || 0 })}</MyText>
              </View>
              <View style={styles.coinImageContainer}>
                <Animated.Image
                  source={Vivicoin}
                  style={[styles.coinImage, { transform: [{ translateY: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) }] }]}
                />
                <Animated.View
                  style={[
                    styles.shade,
                    {
                      transform: [{ scaleY: 0.1 }, { scaleX: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.4] }) }],
                      opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.5] }),
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.walletFuncItems}>
              <View style={styles.walletFuncItemContainer}>
                <TouchableWithoutFeedback onPress={() => navigation.navigate('CameraScannerScreen')}>
                  <View style={[styles.walletFuncItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <Ionicons name="ios-qr-code-outline" size={28} color={Colors[colorScheme].tint} />
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.walletFuncItemText}>{t('Scan')}</MyText>
              </View>
              <View style={styles.walletFuncItemContainer}>
                <TouchableWithoutFeedback onPress={() => navigation.navigate('RecipientListScreen')}>
                  <View style={[styles.walletFuncItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <Ionicons name="ios-send" size={28} color={Colors[colorScheme].tint} />
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.walletFuncItemText}>{t('Payment')}</MyText>
              </View>
              <View style={styles.walletFuncItemContainer}>
                <TouchableWithoutFeedback onPress={() => navigation.navigate('RewardScreen')}>
                  <View style={[styles.walletFuncItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <Ionicons name="ios-gift-outline" size={28} color={Colors[colorScheme].tint} />
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.walletFuncItemText}>{t('Reward')}</MyText>
              </View>
              <View style={styles.walletFuncItemContainer}>
                <TouchableWithoutFeedback
                  style={[styles.walletFuncItem, { backgroundColor: Colors[colorScheme].tintShadow }]}
                  onPress={() => navigation.navigate('MyQRScreen')}
                >
                  <View style={[styles.walletFuncItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <View>
                      <Ionicons name="person-sharp" size={24} color={Colors[colorScheme].tint} />
                      <View style={{ position: 'absolute', right: 0, bottom: -1, padding: 0.5, backgroundColor: Colors[colorScheme].tintShadow }}>
                        <Ionicons name="ios-qr-code" size={11} color={Colors[colorScheme].tint} />
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.walletFuncItemText}>{t('My QR')}</MyText>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <MyText style={styles.transactionTitle}>{t('Recent Transactions')}</MyText>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => navigation.navigate('TransactionListScreen')}>
              <MyText style={styles.showMore}>{t('All Transactions')}</MyText>
              <Ionicons name="ios-chevron-forward-outline" size={16} color="#aaa" />
            </TouchableOpacity>
          </View>
          {transactions && transactions.length ? (
            <View style={{ alignItems: 'center', paddingBottom: 18 }}>
              {transactions?.slice(0, 10).map((item) => (
                <TransactionListItem key={item.id} id={item.id} preloadedData={item} />
              ))}
              <TouchableOpacity onPress={() => navigation.navigate('TransactionListScreen')}>
                <MyText style={{ ...styles.showMore, color: Colors[colorScheme].textSecondary }}>{t('Show More')}</MyText>
              </TouchableOpacity>
            </View>
          ) : (
            <MyText style={{ textAlign: 'center', marginTop: 20 }}>{t('No Recent Transactions')}</MyText>
          )}
        </>
      ) : (
        <View style={{ marginTop: '30%' }}>
          <View style={{ alignItems: 'center' }}>
            <MyText style={{ ...styles.topText, color: Colors[colorScheme].tint }}>Hey {loggedInUser?.username}!</MyText>
            <Image source={Wallet} style={styles.walletImage} />
            <MyText style={{ ...styles.bottomTextTitle, color: Colors[colorScheme].text }}>{t('Create your VIVIBOOM wallet with us!')}</MyText>
            <MyText style={{ ...styles.bottomTextDesc, color: Colors[colorScheme].text }}>
              {t('Open up a world of possibilities by using Vivicoins to buy, trade, and others!')}{' '}
            </MyText>
          </View>
          <View style={{ marginTop: '35%', marginHorizontal: 20, alignItems: 'center' }}>
            <MyButton style={styles.confirmButton} onPress={createWallet} mode="contained">
              {t('Confirm')}
            </MyButton>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  walletContainer: {
    flex: 1,
    marginVertical: 24,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  coinImageContainer: {
    height: 40,
    width: 72,
  },
  coinImage: {
    position: 'relative',
    top: -10,
    width: 60,
    height: 60,
  },
  shade: {
    position: 'absolute',
    bottom: -36,
    width: 40,
    height: 40,
    backgroundColor: '#ccc',
    borderRadius: 40,
    left: 9,
  },
  walletFuncItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 36,
  },
  walletFuncItemContainer: {
    flex: 1,
    alignItems: 'center',
  },
  walletFuncItem: {
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: 'center',
  },
  walletFuncItemText: {
    marginTop: 10,
    width: '100%',
    textAlign: 'center',
    fontWeight: '400',
  },
  transactionTitle: {
    marginVertical: 18,
    fontSize: 18,
  },
  showMore: {
    fontWeight: '400',
    fontSize: 14,
    marginVertical: 18,
  },
  topText: {
    marginBottom: 30,
    fontSize: 28,
    textAlign: 'center',
  },
  bottomTextTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 40,
  },
  bottomTextDesc: {
    fontSize: 16,
    marginHorizontal: 35,
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  walletImage: {
    width: 150,
    height: 150,
    marginVertical: 20,
  },
  confirmButton: {
    borderRadius: 30,
    marginVertical: 10,
  },
});
