import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

export default function GameListScreen({ navigation }: RootStackScreenProps<'GameListScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'setting' });
  const colorScheme = useColorScheme();

  useEffect(() => {
    navigation.setOptions({
      title: 'Games',
      headerTintColor: Colors[colorScheme].text,
      headerBackTitle: '',
    });
  }, [colorScheme, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
      <TouchableOpacity style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]} onPress={() => navigation.navigate('BLEScreen')}>
        <View style={styles.iconAndTitle}>
          <MaterialCommunityIcons name="lock-open-variant" size={24} color={Colors[colorScheme].text} />
          <MyText style={styles.title}>Unlock VIVIVAULT</MyText>
        </View>
        <Ionicons name="ios-chevron-forward-outline" size={20} color={Colors[colorScheme].text} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: Colors[colorScheme].contentBackground }]}
        onPress={() => navigation.navigate('VivivaultTreasureHuntRoot')}
      >
        <View style={styles.iconAndTitle}>
          <MaterialCommunityIcons name="treasure-chest" size={24} color={Colors[colorScheme].text} />
          <MyText style={styles.title}>VIVIVAULT Treasure Hunt</MyText>
        </View>
        <Ionicons name="ios-chevron-forward-outline" size={20} color={Colors[colorScheme].text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 4,
  },
  textInput: {
    height: 40,
    width: null,
  },
  listItem: {
    paddingHorizontal: 18,
    paddingVertical: 24,
    marginVertical: 4,
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
