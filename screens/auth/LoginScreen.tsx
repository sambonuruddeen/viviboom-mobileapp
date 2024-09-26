import { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  ImageBackground,
  ImageRequireSource,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackgroundImage from 'rn-viviboom/assets/images/loginBackground.jpg';
import LogoImage from 'rn-viviboom/assets/images/viviboom-logo-dark.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import AccountReduxActions from 'rn-viviboom/redux/account/AccountReduxActions';

const LogoImageTyped = LogoImage as ImageRequireSource;
const LogoWidth = Math.min(Layout.screen.width - 2 * 18, 480);

export default function LoginScreen({ navigation }: RootStackScreenProps<'LoginScreen'>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordIsVisible, setPasswordIsVisible] = useState<boolean>(false);

  const onLoginPress = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await AccountReduxActions.login({ username, password });
      if (!user.isCompletedTutorial) navigation.replace('WelcomeScreen');
    } catch (err) {
      if (err instanceof AxiosError) {
        Alert.alert(t('Error'), err.response?.data?.message ?? err.message);
      } else if (err instanceof Error) {
        Alert.alert(t('Error'), err.message);
      }
    }
    setIsLoading(false);
  }, [username, password, navigation, t]);

  return (
    <View style={styles.container}>
      <ImageBackground source={BackgroundImage} style={styles.backgroundImage} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.contentContainer}>
        <View>
          <MyText style={styles.welcomeText}>{t('welcome.WELCOME TO')}</MyText>
          <MyImage defaultSource={LogoImageTyped} style={{ width: LogoWidth }} />
          <MyText style={styles.underLogoCaptionText}>{t('welcome.Looking to sign up your school or institution?')}</MyText>
          <MyText onPress={() => Linking.openURL('http://viviboom.com')} style={styles.whatIsVivitaText}>
            {t('welcome.Learn More')}
          </MyText>
        </View>
        <View style={styles.loginFormContainer}>
          <MyText
            style={{
              textAlign: 'center',
              marginBottom: 16,
              fontSize: 18,
              fontWeight: '700',
              color: '#000',
            }}
          >
            {t('welcome.Portal Login')}
          </MyText>

          <TextInput autoCapitalize="none" mode="outlined" label={t('entry.username')} style={styles.usernameTextInput} onChangeText={setUsername} />
          <TextInput
            style={styles.passwordTextInput}
            autoCapitalize="none"
            secureTextEntry={!passwordIsVisible}
            mode="outlined"
            label={t('entry.password')}
            onChangeText={setPassword}
            right={
              <TextInput.Icon
                style={styles.passwordVisibilityIcon}
                icon={passwordIsVisible ? 'eye-off' : 'eye'}
                size={20}
                color={Colors[colorScheme].textSecondary}
                onPress={() => setPasswordIsVisible(!passwordIsVisible)}
              />
            }
          />

          <MyButton style={styles.loginButton} loading={isLoading} mode="contained" onPress={onLoginPress}>
            {t('welcome.Login')}
          </MyButton>
          <TouchableOpacity onPress={() => navigation.navigate('ForgetPasswordScreen')}>
            <MyText style={styles.troubleLoggingInText}>{t('entry.troubleLoggingIn')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('SignUpCodeScreen')}>
            <MyText style={styles.troubleLoggingInText}>{t('entry.noInstitutionAccount')}</MyText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.privacypolicies.com/live/c9a19128-a695-4660-8114-6185cdbc92c6')}>
          <MyText style={styles.footerText}>{t('entry.serviceTerms')}</MyText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://www.privacypolicies.com/live/f674d17e-cfdf-40ec-9218-ec11549cc4a8')}>
          <MyText style={styles.footerText}>{t('entry.privacyPolicy')}</MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 58,
  },
  underLogoCaptionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  whatIsVivitaText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  loginFormContainer: {
    padding: 32,
    marginTop: 24,
    marginBottom: 36,
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  containerTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  usernameTextInput: { width: 280, height: 40, marginVertical: 2 },
  passwordTextInput: { width: 280, height: 40 },
  passwordVisibilityIcon: {
    marginTop: 15,
  },
  troubleLoggingInText: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 18,
    color: '#000',
  },
  loginButton: {
    marginTop: 12,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#fff',
    margin: 18,
  },
});
