import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import BranchApi from 'rn-viviboom/apis/viviboom/BranchApi';
import LogoDark from 'rn-viviboom/assets/images/viviboom-logo-dark.png';
import Logo from 'rn-viviboom/assets/images/viviboom-logo.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import AccountReduxActions from 'rn-viviboom/redux/account/AccountReduxActions';

const logoWidth = Math.min(Layout.screen.width * 0.7, 356);
// The numerator multiplier is the height pixels, and the denominator is the width pixels (image size: 71 x 356)
const logoHeight = (logoWidth * 71) / 356;
const VALID_CODE_LENGTH = 6;
const digitInitialState = new Array(VALID_CODE_LENGTH).fill(0).map(() => '');
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w\w+)+$/;
const usernameRegex = /^[a-zA-Z0-9](_(?!(\.|_))|\.(?!(_|\.))|[a-zA-Z0-9]){3,15}[a-zA-Z0-9]$/;

export default function SignUpCodeScreen({ navigation }: RootStackScreenProps<'SignUpCodeScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'entry' });
  const colorScheme = useColorScheme();
  const [branchToSignUp, setBranchToSignUp] = useState<Branch>();

  const [showSignUpForm, setSignUpForm] = useState(false);

  const [digits, setDigits] = useState(digitInitialState);
  const code = digits.join('');
  const isCodeValid = code.length === VALID_CODE_LENGTH && /^[a-zA-Z0-9]+$/.test(code);

  const digitInputs = useRef<Record<string, TextInput>>({});
  const givenNameInput = useRef<TextInput>();

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onDigitChange = (index: number) => (text: string) => {
    if (index > digits.length) return;
    const val = text;
    const newArr = [...digits];
    if (val.length > 1) {
      if (val.charAt(val.length - 1) !== digits[index]) {
        newArr[index] = val.charAt(val.length - 1);
      } else {
        newArr[index] = val.charAt(0);
      }
      // jump to next char
      if (index < digits.length - 1) {
        digitInputs.current?.[index + 1]?.focus();
      }
    } else if (val.length === 1) {
      newArr[index] = val;
      // jump to next char
      if (index < digits.length - 1) {
        digitInputs.current?.[index + 1]?.focus();
      }
    } else {
      newArr[index] = val;
    }
    setDigits(newArr);
  };

  const onKeyPress = (index: number) => (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'Backspace') {
      // jump to prev char
      if (index > 0) {
        digitInputs.current?.[index - 1]?.focus();
      }
    }
  };

  const onContinue = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await BranchApi.getListPublic({ code });
      if (res.data?.branches?.length === 1) {
        setBranchToSignUp(res.data.branches[0]);
        setSignUpForm(true);
      } else {
        setErrorMessage(t('invalidCode'));
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || err?.message });
    }
    setLoading(false);
  };

  const onSubmit = async () => {
    setErrorMessage('');

    if (!givenName) {
      setErrorMessage(t('required', { name: t('givenName') }));
      return;
    }
    if (!familyName) {
      setErrorMessage(t('required', { name: t('familyName') }));
      return;
    }
    if (!email) {
      setErrorMessage(t('required', { name: t('email') }));
      return;
    }
    if (!username) {
      setErrorMessage(t('required', { name: t('username') }));
      return;
    }
    if (!password) {
      setErrorMessage(t('required', { name: t('password') }));
      return;
    }
    if (!emailRegex.test(email)) {
      setErrorMessage(t('invalidEmail'));
      return;
    }
    if (!usernameRegex.test(username)) {
      setErrorMessage(t('invalidUsername'));
      return;
    }
    if (password?.length < 8) {
      setErrorMessage(t('invalidPassword'));
      return;
    }

    if (username !== '' && password !== '') {
      setLoading(true);
      setErrorMessage('');
      try {
        const user = await AccountReduxActions.signUp({ givenName, familyName, email, username, password, branchCode: code });
        if (!user.isCompletedTutorial) navigation.replace('WelcomeScreen');
      } catch (err) {
        Toast.show({ type: 'error', text1: err.response?.data?.message ?? err?.message });
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerTintColor: Colors[colorScheme].text,
      title: '',
    });
  }, [colorScheme, navigation]);

  useEffect(() => {
    digitInputs?.current?.[0]?.focus();
  }, []);

  useEffect(() => {
    if (showSignUpForm) {
      givenNameInput.current?.focus();
    }
  }, [showSignUpForm]);

  const isButtonDisabled = loading || !isCodeValid;
  const isSignUpButtonDisabled = loading || !givenName || !familyName || !email || !username || !password;

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
      {!showSignUpForm ? (
        <>
          <View style={{ width: '100%' }}>
            <MyText style={styles.subtitle}>{t('codeDescription')}</MyText>
          </View>
          <View style={styles.digits}>
            {digits.map((digit, idx) => (
              <TextInput
                key={`digit-${idx}`}
                ref={(ref) => {
                  digitInputs.current[idx] = ref;
                }}
                style={[styles.digit, { color: Colors[colorScheme].text }]}
                value={digit}
                onChangeText={onDigitChange(idx)}
                onKeyPress={onKeyPress(idx)}
                autoCorrect={false}
                autoCapitalize="characters"
                keyboardType="ascii-capable"
                maxLength={1}
              />
            ))}
          </View>
          {!!errorMessage && (
            <View style={{ width: '100%' }}>
              <MyText style={styles.errMessage}>{errorMessage}</MyText>
            </View>
          )}
          <MyButton style={{ ...styles.button, opacity: isButtonDisabled ? 0.5 : 1 }} mode="contained" disabled={isButtonDisabled} onPress={onContinue}>
            {t('Continue')}
          </MyButton>
        </>
      ) : (
        <>
          <View style={{ width: '100%' }}>
            <MyText style={styles.subtitle}>
              {t('signUpFor', { name: branchToSignUp?.institution ? `${branchToSignUp?.institution?.name} - ${branchToSignUp?.name}` : branchToSignUp?.name })}
            </MyText>
          </View>
          <View style={styles.signUpForm}>
            <View style={styles.names}>
              <PaperTextInput
                ref={givenNameInput}
                style={[styles.nameTextInput, { marginRight: 12 }]}
                mode="outlined"
                label={t('givenName')}
                onChangeText={setGivenName}
                theme={textInputTheme}
                activeOutlineColor={Colors[colorScheme].tint}
              />
              <PaperTextInput
                style={styles.nameTextInput}
                mode="outlined"
                label={t('familyName')}
                onChangeText={setFamilyName}
                theme={textInputTheme}
                activeOutlineColor={Colors[colorScheme].tint}
              />
            </View>
            <PaperTextInput
              style={styles.textInput}
              autoCorrect={false}
              autoCapitalize="none"
              mode="outlined"
              keyboardType="email-address"
              label={t('email')}
              onChangeText={setEmail}
              theme={textInputTheme}
              activeOutlineColor={Colors[colorScheme].tint}
            />
            <PaperTextInput
              style={styles.textInput}
              autoCapitalize="none"
              mode="outlined"
              label={t('username')}
              onChangeText={setUsername}
              theme={textInputTheme}
              activeOutlineColor={Colors[colorScheme].tint}
            />
            <PaperTextInput
              style={styles.textInput}
              autoCapitalize="none"
              secureTextEntry
              mode="outlined"
              label={t('password')}
              onChangeText={setPassword}
              theme={textInputTheme}
              activeOutlineColor={Colors[colorScheme].tint}
            />
          </View>
          {!!errorMessage && (
            <View style={{ width: '100%' }}>
              <MyText style={styles.errMessage}>{errorMessage}</MyText>
            </View>
          )}
          <ActivityIndicator style={{ opacity: loading ? 1 : 0 }} />
          <MyButton
            style={{ ...styles.button, opacity: isSignUpButtonDisabled ? 0.5 : 1 }}
            mode="contained"
            disabled={isSignUpButtonDisabled}
            onPress={onSubmit}
          >
            {t('createAccount')}
          </MyButton>
          <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
            <MyText style={styles.haveAccount}>{t('haveAccount')}</MyText>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
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
  digits: {
    margin: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  digit: {
    flex: 1,
    margin: 4,
    height: 60,
    maxWidth: 52,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    textAlign: 'center',
    borderWidth: 0,
    fontSize: 24,
    fontWeight: '700',
  },
  errMessage: {
    width: '100%',
    textAlign: 'center',
    marginHorizontal: 4,
    marginTop: 12,
    color: '#ff3333',
  },
  button: {
    borderRadius: 40,
    margin: 18,
    paddingHorizontal: 18,
  },
  signUpForm: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  names: {
    width: '100%',
    flexDirection: 'row',
  },
  nameTextInput: {
    flex: 1,
    height: 48,
    marginVertical: 6,
  },
  textInput: {
    height: 48,
    marginVertical: 6,
  },
  haveAccount: {
    textAlign: 'center',
    fontSize: 15,
  },
});
