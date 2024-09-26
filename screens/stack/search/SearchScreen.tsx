import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BadgeApi from 'rn-viviboom/apis/viviboom/BadgeApi';
import ChallengeApi from 'rn-viviboom/apis/viviboom/ChallengeApi';
import ProjectCategoryApi from 'rn-viviboom/apis/viviboom/ProjectCategoryApi';
import Colors from 'rn-viviboom/constants/Colors';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import ProjectReduxActions from 'rn-viviboom/redux/project/ProjectReduxActions';

export default function SearchScreen({ navigation, route }: RootStackScreenProps<'SearchScreen'>) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const account = useReduxStateSelector((s) => s.account);
  const searchHistory = useReduxStateSelector((s) => s.project[account?.id]?.searchHistory || []);

  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const inputRef = useRef<TextInput>();

  const placeholder = route?.params?.placeholder || '';

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);

  const [showAllHistory, setShowAllHistory] = useState(false);

  // API calls
  const fetchRecommended = useCallback(async () => {
    // recommended
    try {
      // use project category
      const categoryRes = await ProjectCategoryApi.getList({ authToken: account?.authToken, limit: 2, offset: Math.floor(Math.random() * 50) });
      let tags = categoryRes?.data?.projectCategories?.map((pc) => pc.name);
      // use challenge
      const challengeRes = await ChallengeApi.getList({ authToken: account?.authToken, order: BadgeOrderType.RANDOM, limit: 2, offset: 0 });
      // use badge
      const badgeRes = await BadgeApi.getList({ authToken: account?.authToken, order: BadgeOrderType.RANDOM, limit: 2, offset: 0 });
      tags = [...tags, ...(challengeRes?.data?.challenges?.map((b) => b.name) || []), ...(badgeRes?.data?.badges?.map((b) => b.name) || [])];
      tags.sort();
      setRecommendedTags(tags);
    } catch (err) {
      console.log(err);
    }
  }, [account?.authToken]);

  const onSearch = useCallback(() => {
    const submittedKeyword = searchKeyword.trim() || placeholder;
    if (!submittedKeyword) {
      Toast.show({ text1: 'Please input your search keywords!', type: 'error' });
      return;
    }
    navigation.navigate('SearchResultScreen', { searchKeyword: submittedKeyword, defaultResultTab: route?.params?.defaultResultTab || 0 });
  }, [navigation, placeholder, route?.params?.defaultResultTab, searchKeyword]);

  const onCancel = useCallback(() => {
    inputRef.current.blur();
    navigation.pop();
  }, [navigation]);

  const onSelect = useCallback(
    (selectedKeyword: string) => () => {
      if (!selectedKeyword) return;
      navigation.navigate('SearchResultScreen', { searchKeyword: selectedKeyword, defaultResultTab: route?.params?.defaultResultTab || 0 });
    },
    [navigation, route?.params?.defaultResultTab],
  );

  useEffect(() => {
    fetchRecommended();
    if (isFocused) setTimeout(() => inputRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  return (
    <View style={{ ...styles.container, paddingTop: insets.top, height: styles.searchHeader.height + insets.top }}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: Colors[colorScheme].contentBackground, color: Colors[colorScheme].text }]}
            placeholder={placeholder || 'Search'}
            ref={inputRef}
            onChangeText={setSearchKeyword}
            returnKeyType="search"
            blurOnSubmit
            onSubmitEditing={onSearch}
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <Ionicons style={styles.iconStyle} name="ios-search-outline" size={15} color="#666" />
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <MyText style={{ fontSize: 16, fontWeight: '400', letterSpacing: 1, color: Colors[colorScheme].tint }}>Cancel</MyText>
        </TouchableOpacity>
      </View>
      <View style={[styles.contentContainer, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        {isFocused && searchHistory.length > 0 && (
          <>
            <View style={styles.titleRow}>
              <MyText style={styles.discoverText}>History</MyText>
              {searchHistory.length > 6 && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowAllHistory((b) => !b)}>
                  <MyText style={styles.expandText}>{showAllHistory ? 'Hide' : 'Expand'}</MyText>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.discover}>
              {searchHistory.slice(0, showAllHistory ? 20 : 6).map((tag) => (
                <Chip
                  key={tag}
                  style={[styles.chip, { backgroundColor: Colors[colorScheme].textInput }]}
                  onPress={onSelect(tag)}
                  textStyle={{ marginVertical: 0 }}
                >
                  <MyText style={{ ...styles.chipText, color: Colors[colorScheme].textSecondary }}>{tag}</MyText>
                </Chip>
              ))}
            </View>
            <TouchableOpacity style={styles.clearAll} activeOpacity={0.8} onPress={() => ProjectReduxActions.save({ searchHistory: [] })}>
              <MyText style={styles.clearAllText}>Clear History</MyText>
            </TouchableOpacity>
          </>
        )}
        {isFocused && recommendedTags.length > 0 && (
          <>
            <MyText style={styles.discoverText}>Explore</MyText>
            <View style={styles.discover}>
              {recommendedTags.map((tag) => (
                <Chip
                  key={tag}
                  style={[styles.chip, { backgroundColor: Colors[colorScheme].textInput }]}
                  onPress={onSelect(tag)}
                  textStyle={{ marginVertical: 0 }}
                >
                  <MyText style={{ ...styles.chipText, color: Colors[colorScheme].textSecondary }}>{tag}</MyText>
                </Chip>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  searchBar: {
    flex: 1,
    marginLeft: 15,
    height: 35,
  },
  iconStyle: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  searchInput: {
    paddingLeft: 30,
    paddingRight: 10,
    width: '100%',
    height: '100%',
    borderRadius: 17.5,
    fontSize: 15,
  },
  cancelButton: {
    height: 35,
    minWidth: 80,
    maxWidth: 120,
    width: '10%',
    borderColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  discover: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  discoverText: {
    marginVertical: 8,
    fontSize: 15,
  },
  chip: {
    marginVertical: 5,
    marginRight: 10,
    height: 30,
  },
  chipText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '400',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandText: {
    fontWeight: '400',
    fontSize: 12,
  },
  clearAll: {
    width: '100%',
    alignItems: 'center',
    margin: 12,
  },
  clearAllText: {
    fontWeight: '400',
    fontSize: 13,
    color: '#666',
  },
});
