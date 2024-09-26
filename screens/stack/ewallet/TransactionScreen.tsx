import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { v4 as uuidv4 } from 'uuid';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';
import SendAnim from 'rn-viviboom/assets/animations/sending.json';
import Currency from 'rn-viviboom/assets/images/currency-tint.png';
import CurrencyDark from 'rn-viviboom/assets/images/currency-white.png';
import defaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import rejectSelfTransaction from 'rn-viviboom/assets/images/reject.png';
import Colors from 'rn-viviboom/constants/Colors';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const screen = Dimensions.get('screen');
const DEFAULT_PROFILE_IMAGE_SIZE = 256;

export default function TransactionScreen({ navigation, route }: RootStackScreenProps<'TransactionScreen'>) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const loggedInUserAcc = useReduxStateSelector((state) => state.account);
  const loggedInUserWallet = useReduxStateSelector((state) => state.wallet?.[loggedInUserAcc?.id]?.wallet);

  const [isSending, setSending] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [uuidCode] = useState(uuidv4());
  const [receiver, setReceiver] = useState<User>();
  const [isFetchingReceiver, setFetchingReceiver] = useState(false);
  const receiverUserId = +(route.params?.userId || 0);
  const receiverWalletId = +(receiver?.wallet?.id || 0);

  const postTransaction = useCallback(async () => {
    const requestParams = {
      authToken: loggedInUserAcc?.authToken,
      receiverWalletId,
      amount: Number(transactionAmount),
      description: transactionDescription,
      clientRequestUuid: uuidCode,
    };
    if (transactionAmount.includes('.')) {
      Alert.alert('The transaction amount should be an integer');
      return;
    }
    if (Number(transactionAmount) > loggedInUserWallet?.balance) {
      Alert.alert('Insufficient balance in your wallet');
      return;
    }
    if (Number(transactionAmount) <= 0) {
      Alert.alert('Please enter your transaction amount');
      return;
    }
    if (receiverUserId === loggedInUserAcc.id) {
      Alert.alert("Oops! You can't send funds to yourself. Please choose a different recipient.");
      return;
    }
    setSending(true);
    try {
      const res = await VivicoinApi.postTransaction(requestParams);
      if (receiver?.username) navigation.replace('TransactionResultScreen', { transactionId: res.data?.transactionId, username: receiver?.username });
    } catch (err) {
      console.error(err);
      Alert.alert('Transaction was declined, please try again later!');
    }
    setSending(false);
  }, [
    loggedInUserAcc,
    receiverUserId,
    receiverWalletId,
    transactionAmount,
    transactionDescription,
    uuidCode,
    loggedInUserWallet?.balance,
    receiver?.username,
    navigation,
  ]);

  const fetchReceiver = useCallback(async () => {
    setFetchingReceiver(true);
    const requestParams = {
      authToken: loggedInUserAcc?.authToken,
      userId: receiverUserId,
      verboseAttributes: ['wallet'],
    };
    try {
      const res = await UserApi.get(requestParams);
      setReceiver(res.data?.user);
    } catch (err) {
      console.error(err);
    }
    setFetchingReceiver(false);
  }, [loggedInUserAcc?.authToken, receiverUserId]);

  useEffect(() => {
    fetchReceiver();
  }, [fetchReceiver]);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: '',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  if (isFetchingReceiver) return <View style={[styles.hideAll, { backgroundColor: Colors[colorScheme].background }]} />;

  return (
    <KeyboardAvoidingView
      style={{ ...styles.container, padding: 18, backgroundColor: Colors[colorScheme].background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {loggedInUserAcc.id !== receiverUserId && !!receiver?.wallet?.id ? (
        <View style={styles.container}>
          <View style={styles.paymentForm}>
            <View style={{ alignItems: 'center' }}>
              <MyImage
                style={styles.avatar}
                uri={receiver?.profileImageUri}
                params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                defaultSource={defaultProfilePicture}
                cacheDisabled
              />
              <MyText style={{ marginVertical: 12, fontSize: 18 }}>{receiver?.username}</MyText>
            </View>
            <MyText style={{ marginTop: 36, fontWeight: '400' }}>{t('Paying')}</MyText>
            <MyText style={styles.paymentAmountTitle}>{receiver?.name}</MyText>
            {isSending ? (
              <View style={styles.sendAnimContainer}>
                <View style={styles.sendAnimInner}>
                  <LottieView source={SendAnim} style={styles.sendAnim} autoPlay />
                </View>
              </View>
            ) : (
              <>
                <View style={{ ...styles.amountInputContainer, backgroundColor: Colors[colorScheme].secondaryBackground }}>
                  <Image source={colorScheme === 'dark' ? CurrencyDark : Currency} style={styles.amountInputCurrency} />
                  <TextInput
                    style={{ ...styles.amountInput, color: Colors[colorScheme].tint }}
                    keyboardType="number-pad"
                    blurOnSubmit
                    placeholderTextColor={Colors[colorScheme].text}
                    placeholder="0"
                    onChangeText={setTransactionAmount}
                  />
                </View>
                <View style={{ ...styles.descriptionContainer, backgroundColor: Colors[colorScheme].secondaryBackground }}>
                  <TextInput
                    style={{ ...styles.descriptionInput, color: Colors[colorScheme].text }}
                    multiline
                    returnKeyType="done"
                    blurOnSubmit
                    placeholderTextColor={Colors[colorScheme].text}
                    placeholder="Add a Note..."
                    onChangeText={(e) => setTransactionDescription(e)}
                  />
                </View>
              </>
            )}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={{ ...styles.confirmButton, backgroundColor: Colors[colorScheme].tint }} onPress={postTransaction} disabled={isSending}>
              <Ionicons name="ios-send" size={18} color={Colors[colorScheme].textInverse} />
              <MyText style={{ color: Colors[colorScheme].textInverse, fontSize: 18, marginLeft: 8 }}>{t(isSending ? 'Sending...' : 'Send')}</MyText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ ...styles.contentContainer, backgroundColor: Colors[colorScheme].background }}>
          <View style={{ marginVertical: '50%', alignItems: 'center' }}>
            <Image source={rejectSelfTransaction} style={styles.giftImage} />
            <MyText style={{ ...styles.smallText, color: Colors[colorScheme].text }}>
              {t('Oops! This seems to be an invalid recipient. Please try again.')}
            </MyText>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#fff',
  },
  paymentForm: {
    alignItems: 'center',
    paddingVertical: 18,
    width: '100%',
  },
  paymentAmountTitle: {
    fontSize: 24,
    marginVertical: 8,
  },
  amountInputContainer: {
    margin: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    width: 160,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  amountInputCurrency: {
    width: 24,
    height: 24,
    position: 'absolute',
    left: 18,
  },
  amountInput: {
    width: '100%',
    height: '100%',
    fontSize: 20,
    textAlign: 'right',
  },
  descriptionContainer: {
    height: 100,
    width: '100%',
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  descriptionInput: {
    textAlignVertical: 'top',
    width: '100%',
    height: '100%',
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 36,
  },
  confirmButton: {
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    height: screen.height,
    alignItems: 'center',
  },
  giftImage: {
    width: 150,
    height: 150,
    marginVertical: 50,
  },
  smallText: {
    marginHorizontal: 20,
    fontSize: 25,
    textAlign: 'center',
  },
  hideAll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sendAnimContainer: {
    width: screen.width,
    height: 196,
    alignItems: 'center',
  },
  sendAnimInner: {
    position: 'relative',
    top: -52,
    width: 300,
    height: 300,
    alignItems: 'center',
  },
  sendAnim: {
    width: '100%',
    height: '100%',
  },
});
