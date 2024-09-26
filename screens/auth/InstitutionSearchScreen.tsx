import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import InstitutionApi from 'rn-viviboom/apis/viviboom/InstitutionApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import { RootStackScreenProps } from '../../navigation/types';

export default function InstitutionSearchScreen({ navigation }: RootStackScreenProps<'InstitutionSearchScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'entry' });
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [institution, setInstitution] = useState<Institution>();

  const fetchInstitutions = useCallback(async () => {
    if (!keywords) {
      setInstitutions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await InstitutionApi.getList({ keywords, limit: 30 });
      setInstitutions(res.data.institutions);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }, [keywords]);

  const onPressInstitution = (v: Institution) => () => {
    setInstitution(v);
    // navigation.navigate('LoginScreen');
  };

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerTintColor: Colors[colorScheme].text,
      title: '',
    });
  }, [colorScheme, navigation]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      <View style={styles.titleContainer}>
        <MyText style={styles.title}>{t("What's your institution's name?")}</MyText>
        {loading && <ActivityIndicator />}
      </View>
      <View style={styles.textInputContainer}>
        <TextInput
          style={{ ...styles.textInput, color: Colors[colorScheme].text }}
          placeholder={t('findSchool')}
          placeholderTextColor={Colors[colorScheme].textSecondary}
          value={keywords}
          onChangeText={setKeywords}
        />
        {!!keywords && (
          <TouchableOpacity style={styles.closeButton} onPress={() => setKeywords('')}>
            <Ionicons name="ios-close-circle" size={20} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.institutionList}>
        {institutions.map((v) => (
          <TouchableOpacity key={`institution-${v.id}`} style={styles.institutionItem} onPress={onPressInstitution(v)}>
            <MyText style={styles.institutionItemText}>{v.name}</MyText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 30,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
  },
  textInputContainer: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderColor: 'rgba(128,128,128,0.5)',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  textInput: {
    color: '#aaa',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 12,
    bottom: 0,
    justifyContent: 'center',
  },
  institutionList: {
    width: '100%',
  },
  institutionItem: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderColor: 'rgba(128,128,128,0.5)',
    borderBottomWidth: 0.5,
  },
  institutionItemText: {
    fontSize: 18,
    fontWeight: '400',
  },
});
