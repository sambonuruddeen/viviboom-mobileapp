import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';
import GiftAnim from 'rn-viviboom/assets/animations/gift.json';
import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const screen = Dimensions.get('screen');

export default function RewardScreen({ navigation, route }: RootStackScreenProps<'RewardScreen'>) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'wallet' });
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const [rewardCode, setRewardCode] = useState(decodeURIComponent(route?.params?.code || ''));
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState('Enter code here...');

  const lottieRef = useRef<LottieView>();

  const rewardClaim = useCallback(async () => {
    if (!rewardCode) {
      Toast.show({ type: 'error', text1: 'Please enter a reward code to proceed' });
      return;
    }
    setLoading(true);
    const requestParams = {
      authToken,
      code: rewardCode,
    };
    try {
      const res = await VivicoinApi.claimReward(requestParams);
      navigation.replace('RewardResultScreen', { transactionId: res.data?.transactionId });
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: err.response.data.message ?? err.message });
    }
    setLoading(false);
  }, [authToken, navigation, rewardCode]);

  const onReset = () => {
    setLoading(false);
    setRewardCode('');
  };

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: '',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  useEffect(() => {
    lottieRef.current?.play(0, 57);
  }, []);

  useEffect(() => {
    if (route?.params?.code) {
      rewardClaim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ ...styles.container, backgroundColor: Colors[colorScheme].background }}
    >
      <View>
        <MyText style={{ ...styles.largeText, marginTop: 20, color: Colors[colorScheme].tint }}>{t('Yes!')}</MyText>
        <MyText style={{ ...styles.smallText, color: Colors[colorScheme].tint }}>{t('You have found a secret chest')}</MyText>
      </View>
      <LottieView ref={lottieRef} source={GiftAnim} style={styles.giftImage} loop />
      <View style={{ height: 240, alignItems: 'center' }}>
        {loading ? (
          <ActivityIndicator size={36} style={{ margin: 36 }} />
        ) : (
          <>
            <MyText style={{ fontSize: 16, textAlign: 'center', marginTop: 20 }}>{t('Enter the code here to collect your reward!')}</MyText>
            <View style={{ ...styles.textInputContainer, borderBottomColor: Colors[colorScheme].text }}>
              <TextInput
                style={{ ...styles.textInput, color: Colors[colorScheme].text }}
                placeholderTextColor={Colors[colorScheme].text}
                placeholder={placeholder}
                onFocus={() => setPlaceholder('')}
                onChangeText={setRewardCode}
                value={rewardCode}
                multiline={true}
                blurOnSubmit={true}
                onSubmitEditing={rewardClaim}
              />
              {rewardCode?.length > 0 && (
                <TouchableOpacity style={styles.resetButtonContainer} activeOpacity={1} onPress={onReset}>
                  <Ionicons style={{ color: '#aaa' }} name="close-circle-outline" size={25} />
                </TouchableOpacity>
              )}
            </View>
            <MyButton style={styles.redeemButton} onPress={rewardClaim} mode="contained">
              {t('Redeem')}
            </MyButton>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: screen.height,
  },
  giftImage: {
    width: screen.width,
    alignItems: 'center',
  },
  confirmButton: {
    borderRadius: 50,
    marginTop: 50,
  },
  largeText: {
    fontSize: 28,
    textAlign: 'center',
  },
  smallText: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    margin: 12,
  },
  textInputContainer: {
    height: 40,
    margin: 18,
    width: 200,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    display: 'flex',
    flexDirection: 'row',
  },
  resetButtonContainer: {
    alignItems: 'center',
  },
  textInput: {
    height: '100%',
    width: '100%',
    textAlign: 'center',
  },
  redeemButton: {
    width: '90%',
  },
});
