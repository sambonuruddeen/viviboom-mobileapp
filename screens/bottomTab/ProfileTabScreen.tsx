import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootTabScreenProps } from 'rn-viviboom/navigation/types';
import SettingReduxActions from 'rn-viviboom/redux/setting/SettingReduxActions';
import UserProfile from 'rn-viviboom/screens/bottomTab/profile/UserProfile';

export default function ProfileTabScreen({ navigation }: RootTabScreenProps<'ProfileTabScreen'>) {
  const user = useReduxStateSelector((s) => s.account);
  const colorScheme = useColorScheme();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          {(user?.institution?.isVaultEnabled || (user?.institution?.isRewardEnabled && user?.branch?.allowVivicoinRewards)) && (
            <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.push('CameraScannerScreen')}>
              <View>
                <Ionicons name="scan" size={24} color={Colors[colorScheme].text} />
                <Ionicons name="remove" size={24} color={Colors[colorScheme].text} style={{ position: 'absolute', left: 0.5 }} />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.push('SearchScreen')}>
            <Ionicons name="ios-search-outline" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingBtn} onPress={() => SettingReduxActions.toggleColorScheme(colorScheme)}>
            <Feather name={colorScheme === 'light' ? 'moon' : 'sun'} size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
      ),
      headerShadowVisible: false,
    });
  }, [colorScheme, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#EDF1F8' }]}>
      <UserProfile user={user} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    paddingRight: 5,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingBtn: {
    marginTop: 1,
    marginHorizontal: 12,
  },
});
