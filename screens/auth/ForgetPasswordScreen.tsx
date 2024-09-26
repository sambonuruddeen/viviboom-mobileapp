import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import LogoDark from 'rn-viviboom/assets/images/viviboom-logo-dark.png';
import Logo from 'rn-viviboom/assets/images/viviboom-logo.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const logoWidth = Math.min(Layout.screen.width * 0.7, 356);
const logoHeight = (logoWidth * 71) / 356;
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w\w+)+$/;

export default function ForgetPasswordScreen({ navigation }: RootStackScreenProps<'ForgetPasswordScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();

  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const isButtonDisabled = loading || !email || !emailRegex.test(email);

  const onContinue = async () => {
    if (!email || !emailRegex.test(email)) {
      Toast.show({ type: 'error', text1: 'Invalid Email' });
      return;
    }
    setLoading(true);
    setEmailSent(false);
    try {
      await UserApi.passwordResetToken({ email });
      setEmailSent(true);
      Toast.show({ type: 'success', text1: t('email.tokenSent') });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || err.message });
    }
    setLoading(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerTintColor: Colors[colorScheme].text,
      title: '',
    });
  }, [colorScheme, navigation]);

  const textInputTheme = useMemo(
    () => ({
      colors: { background: Colors[colorScheme].contentBackground, text: Colors[colorScheme].text, placeholder: Colors[colorScheme].textSecondary },
    }),
    [colorScheme],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
    >
      <Image source={colorScheme === 'dark' ? LogoDark : Logo} style={styles.logo} />
      <View style={{ width: '100%' }}>
        <MyText style={styles.subtitle}>{t('email.resetPasswordText')}</MyText>
      </View>
      <TextInput
        style={styles.textInput}
        autoCapitalize="none"
        autoCorrect={false}
        mode="outlined"
        label="Email"
        keyboardType="email-address"
        onChangeText={setEmail}
        theme={textInputTheme}
        activeOutlineColor={Colors[colorScheme].tint}
      />
      {emailSent ? <MyText style={styles.successText}>{t('email.sentResetPasswordLink')}</MyText> : <ActivityIndicator style={{ opacity: loading ? 1 : 0 }} />}
      <MyButton style={{ ...styles.button, opacity: isButtonDisabled ? 0.5 : 1 }} mode="contained" disabled={isButtonDisabled} onPress={onContinue}>
        {t('entry.Continue')}
      </MyButton>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  logo: {
    width: logoWidth,
    height: logoHeight,
    marginVertical: 18,
  },
  subtitle: {
    fontWeight: '400',
    width: '100%',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
  },
  textInput: {
    height: 48,
    marginVertical: 18,
    width: '100%',
    maxWidth: 350,
  },
  successText: {
    color: '#2bae66',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    borderRadius: 40,
    margin: 18,
    paddingHorizontal: 18,
  },
});
