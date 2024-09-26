import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ColorSchemeName, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import SearchResultTabIndex from 'rn-viviboom/enums/SearchResultTabIndex';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootTabParamList } from 'rn-viviboom/navigation/types';

const SearchHeaderColors: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    background: '#f2f2f2',
    inputBackground: '#ddd',
  },
  dark: {
    background: '#000',
    inputBackground: '#222',
  },
};

const DEFAULT_PROFILE_IMAGE_SIZE = 256;
const headerHeight = 50;
const branchHeaderHeight = 60;

interface EventSearchHeaderProps {
  navigation: BottomTabNavigationProp<RootTabParamList, 'EventTabScreen', undefined>;
  branch: Branch;
  offset: Animated.Value;
  eventTopHeight: number;
  openBranchBottomSheet: () => void;
}

export default function EventSearchHeader({ navigation, branch, offset, eventTopHeight, openBranchBottomSheet }: EventSearchHeaderProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'events' });
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((s) => s.account);
  const insets = useSafeAreaInsets();

  const [showBranch, setShowBranch] = useState(false);

  const onSearch = () => {
    navigation.navigate('SearchScreen', { defaultResultTab: SearchResultTabIndex.EVENT });
  };

  useEffect(() => {
    offset.addListener(({ value }) => {
      if (value > eventTopHeight - headerHeight - insets.top + branchHeaderHeight) setShowBranch(true);
      else setShowBranch(false);
      return () => {
        offset.removeAllListeners();
      };
    });
  }, [eventTopHeight, insets.top, offset]);

  return (
    <View
      style={{
        ...styles.container,
        paddingTop: insets.top,
        height: styles.container.height + insets.top,
        backgroundColor: SearchHeaderColors[colorScheme].background,
      }}
    >
      <View style={styles.searchContainer}>
        {showBranch ? (
          <View style={styles.branchRow}>
            <TouchableOpacity style={styles.branchLine} onPress={openBranchBottomSheet}>
              <Ionicons name="ios-location" size={16} style={{ marginHorizontal: 8, color: Colors[colorScheme].tint }} />
              <MyText style={{ ...styles.branchText, color: Colors[colorScheme].tint }}>{branch?.name || 'All Branches'}</MyText>
              <Ionicons name="ios-chevron-down" size={16} style={{ marginHorizontal: 4, color: Colors[colorScheme].tint }} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.searchBox, { backgroundColor: SearchHeaderColors[colorScheme].inputBackground }]}
            activeOpacity={1}
            onPress={onSearch}
          >
            <Ionicons name="ios-search-outline" size={15} color="#666" />
            <MyText style={{ color: '#666', fontWeight: '400', fontSize: 14, marginLeft: 4, marginTop: Platform.OS === 'ios' ? 2 : 0 }} numberOfLines={1}>
              {'Search for Events...'}
            </MyText>
          </TouchableOpacity>
        )}
      </View>
      {showBranch && (
        <TouchableOpacity style={styles.searchIconContainer} activeOpacity={1} onPress={onSearch}>
          <Ionicons name="ios-search-outline" size={22} color="#666" />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.avatarContainer} activeOpacity={1} onPress={() => navigation.navigate('ProfileTabScreen')}>
        <MyImage style={styles.avatar} uri={user.profileImageUri} defaultSource={DefaultProfilePicture} params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  searchIconContainer: {
    minWidth: 30,
    maxWidth: 40,
    width: '5%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  avatarContainer: {
    minWidth: 50,
    maxWidth: 80,
    width: '10%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 5,
    height: 32,
  },
  searchBox: {
    paddingLeft: 10,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 17.5,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  branchRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchText: {
    fontSize: 16,
  },
});
