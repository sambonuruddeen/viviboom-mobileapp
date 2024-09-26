/* eslint-disable no-underscore-dangle */
import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Provider, TextInput } from 'react-native-paper';
import RBSheet from 'react-native-raw-bottom-sheet';

import AccountApi from 'rn-viviboom/apis/viviboom/AccountApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import AccountReduxActions from 'rn-viviboom/redux/account/AccountReduxActions';
import SettingReduxActions from 'rn-viviboom/redux/setting/SettingReduxActions';

export default function SettingScreen({ navigation }: RootStackScreenProps<'SettingScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'setting' });
  const customColorScheme = useReduxStateSelector((state) => state.setting?.colorScheme);
  const colorScheme = useColorScheme();

  const user = useReduxStateSelector((state) => state.account);

  const curPasswordModalRef = useRef<RBSheet>();

  const [isProcessing, setIsProcessing] = useState<boolean>();
  const [curPassword, setCurPassword] = useState<string>();

  useEffect(() => {
    navigation.setOptions({
      title: 'Settings',
      headerTintColor: Colors[colorScheme].text,
      headerBackTitle: '',
    });
  }, [colorScheme, navigation]);

  const onLogoutPress = () => {
    AccountReduxActions.logout();
  };

  const onDeleteAccountPress = () => {
    curPasswordModalRef.current.open();
  };

  const onConfirmDeleteAcctWithCurPasswordPressed = async () => {
    setIsProcessing(true);
    try {
      await AccountApi.deleteUser({ authToken: user?.authToken, userId: `${user.id}`, password: curPassword });
      await AccountReduxActions.logout();
    } catch (err) {
      if (err instanceof AxiosError) {
        Alert.alert('Error', err.response?.data?.message ?? err.message);
      } else {
        console.error(err);
      }
      setIsProcessing(false);
    }
  };

  const textInputTheme = useMemo(
    () => ({
      colors: { background: Colors[colorScheme].contentBackground, text: Colors[colorScheme].text, placeholder: Colors[colorScheme].textSecondary },
    }),
    [colorScheme],
  );

  return (
    <Provider>
      <RBSheet
        ref={curPasswordModalRef}
        height={180}
        customStyles={{ container: { paddingHorizontal: 12, paddingTop: 12, backgroundColor: Colors[colorScheme].contentBackground } }}
      >
        <MyText>Warning! Your account will be deleted!</MyText>
        <MyText>Enter your password to proceed:</MyText>
        <TextInput
          secureTextEntry
          mode="outlined"
          style={styles.textInput}
          onChangeText={setCurPassword}
          theme={textInputTheme}
          activeOutlineColor={Colors[colorScheme].tint}
          autoFocus
        />
        <MyButton
          style={{ marginTop: 18, width: 200, alignSelf: 'center' }}
          contentStyle={{ marginHorizontal: 2 }}
          mode="contained"
          onPress={onConfirmDeleteAcctWithCurPasswordPressed}
          loading={isProcessing}
        >
          {t('Confirm')}
        </MyButton>
      </RBSheet>
      <View style={styles.container}>
        <MyText style={{ ...styles.sectionTitleText, color: Colors[colorScheme].textSecondary }}>{t('Dark Mode')}</MyText>
        <View style={[styles.sectionContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
          <View style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <View style={styles.iconAndTitle}>
              <Ionicons name="ios-settings-outline" size={24} color={Colors[colorScheme].text} />
              <MyText style={styles.title}>Automatic (follow system)</MyText>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Switch
                trackColor={{ true: '#7353ff' }}
                ios_backgroundColor="#3e3e3e"
                value={!customColorScheme}
                onValueChange={() => SettingReduxActions.save({ colorScheme: !customColorScheme ? colorScheme : null })}
              />
            </View>
          </View>
          <View style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <View style={styles.iconAndTitle}>
              <Ionicons name="ios-moon-outline" size={24} color={Colors[colorScheme].text} />
              <MyText style={styles.title}>Enable dark mode</MyText>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Switch
                trackColor={{ true: '#7353ff' }}
                ios_backgroundColor="#3e3e3e"
                value={colorScheme === 'dark'}
                disabled={!customColorScheme}
                onValueChange={() => SettingReduxActions.toggleColorScheme(colorScheme)}
              />
            </View>
          </View>
        </View>
        <MyText style={{ ...styles.sectionTitleText, color: Colors[colorScheme].textSecondary }}>{t('Account Settings')}</MyText>
        <View style={[styles.sectionContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
          <TouchableOpacity style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]} onPress={onLogoutPress}>
            <View style={styles.iconAndTitle}>
              <Ionicons name="ios-log-out-outline" size={24} color={Colors[colorScheme].text} />
              <MyText style={styles.title}>Logout</MyText>
            </View>
            <Ionicons name="ios-chevron-forward-outline" size={20} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]} onPress={onDeleteAccountPress}>
            <View style={styles.iconAndTitle}>
              <Ionicons name="ios-trash-outline" size={24} color={Colors[colorScheme].text} />
              <MyText style={styles.title}>Delete Account</MyText>
            </View>
            <Ionicons name="ios-chevron-forward-outline" size={20} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
        <MyText style={{ ...styles.sectionTitleText, color: Colors[colorScheme].textSecondary }}>{t('About')}</MyText>
        <View style={[styles.sectionContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
          <TouchableOpacity
            style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]}
            onPress={() => Linking.openURL('https://www.privacypolicies.com/live/c9a19128-a695-4660-8114-6185cdbc92c6')}
          >
            <View style={styles.iconAndTitle}>
              <Ionicons name="ios-receipt-outline" size={24} color={Colors[colorScheme].text} />
              <MyText style={styles.title}>Terms of Service</MyText>
            </View>
            <Ionicons name="ios-chevron-forward-outline" size={20} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]}
            onPress={() => Linking.openURL('https://www.privacypolicies.com/live/f674d17e-cfdf-40ec-9218-ec11549cc4a8')}
          >
            <View style={styles.iconAndTitle}>
              <Ionicons name="ios-key-outline" size={24} color={Colors[colorScheme].text} />
              <MyText style={styles.title}>Privacy Policy</MyText>
            </View>
            <Ionicons name="ios-chevron-forward-outline" size={20} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 18,
    marginVertical: 4,
  },
  sectionTitleText: {
    marginHorizontal: 18,
    marginVertical: 6,
    fontSize: 13,
  },
  sectionContainer: {
    marginVertical: 4,
  },
  textInput: {
    height: 40,
    width: null,
  },
  listItem: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginHorizontal: 18,
    fontSize: 17,
    fontWeight: '400',
  },
});
