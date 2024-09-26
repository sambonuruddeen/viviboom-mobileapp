import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, View } from 'react-native';

import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';
import GiftAnim from 'rn-viviboom/assets/animations/gift.json';
import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const screen = Dimensions.get('screen');

export default function RewardResultScreen({ navigation, route }: RootStackScreenProps<'RewardResultScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const colorScheme = useColorScheme();
  const rewardTransactionId = route.params?.transactionId;
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const [transaction, setTransaction] = useState<Transaction>();
  const lottieRef = useRef<LottieView>();

  const fetchTransaction = useCallback(async () => {
    const requestParams = {
      authToken,
      transactionId: rewardTransactionId,
    };
    try {
      const res = await VivicoinApi.getTransaction(requestParams);
      setTransaction(res.data?.transaction);
      lottieRef.current?.play(58, 250);
    } catch (err) {
      console.error(err);
    }
  }, [authToken, rewardTransactionId]);

  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      title: '',
      headerShadowVisible: false,
    });
  }, [colorScheme, navigation]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  return (
    <View style={{ ...styles.container, backgroundColor: Colors[colorScheme].background }}>
      <MyText style={{ ...styles.largeText, color: Colors[colorScheme].tint }}>{t('Congratulations!')}</MyText>
      <LottieView source={GiftAnim} style={styles.giftImage} ref={lottieRef} loop={false} />
      <MyText style={{ ...styles.smallText, color: Colors[colorScheme].tint }}>{t('You have earned')}</MyText>
      <MyText style={{ ...styles.largeText, marginBottom: 25, color: Colors[colorScheme].tint }}>
        {t('VIVICOINWithCount', { count: transaction?.amount })}
      </MyText>
      <View style={{ marginBottom: 20 }}>
        <MyButton style={styles.confirmButton} mode="contained" onPress={() => navigation.replace('EWalletScreen')}>
          {t('Done')}
        </MyButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    height: screen.height,
  },
  largeText: {
    fontSize: 28,
    textAlign: 'center',
  },
  smallText: {
    fontSize: 18,
    fontWeight: '400',
    margin: 8,
    textAlign: 'center',
  },
  giftImage: {
    width: screen.width,
    aspectRatio: 1,
  },
  confirmButton: {
    borderRadius: 50,
    marginVertical: 10,
  },
});
