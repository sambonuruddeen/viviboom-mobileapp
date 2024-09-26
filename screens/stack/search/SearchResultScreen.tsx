import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSchemeName, Dimensions, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

import BranchApi from 'rn-viviboom/apis/viviboom/BranchApi';
import Colors from 'rn-viviboom/constants/Colors';
import SearchResultTabIndex from 'rn-viviboom/enums/SearchResultTabIndex';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import ProjectReduxActions from 'rn-viviboom/redux/project/ProjectReduxActions';
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

import BadgeSearchResultTab from './BadgeSearchResultTab';
import ChallengeSearchResultTab from './ChallengeSearchResultTab';
import DefaultSearchResultTab from './DefaultSearchResultTab';
import EventSearchResultTab from './EventSearchResultTab';
import MemberSearchResultTab from './MemberSearchResultTab';
import ProjectSearchResultTab from './ProjectSearchResultTab';

const screen = Dimensions.get('screen');

const SearchResultScreenColors: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    secondaryBackground: '#f2f2f2',
  },
  dark: {
    secondaryBackground: '#000',
  },
};

const routes = [
  { key: 'All', title: 'All' },
  { key: 'Badge', title: 'Badge' },
  { key: 'Challenge', title: 'Challenge' },
  { key: 'Project', title: 'Project' },
  { key: 'VIVINAUT', title: 'VIVINAUT' },
  { key: 'Event', title: 'Event' },
];

type SceneProps = SceneRendererProps & {
  route: {
    key: string;
    title: string;
  };
};

const tabWidth = Math.max(screen.width / routes.length, 80);

const MyTabBar = (props) => {
  const colorScheme = useColorScheme();
  const isRootEnv = useReduxStateSelector((s) => s.account?.institutionId === 1);
  return (
    <TabBar
      {...props}
      scrollEnabled
      tabStyle={{ width: tabWidth }}
      indicatorStyle={{ backgroundColor: Colors[colorScheme].tint, width: 30, left: (tabWidth - 30) / 2 }}
      style={{
        backgroundColor: Colors[colorScheme].contentBackground,
        height: 44,
        shadowOffset: { height: 0, width: 0 },
        shadowColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
      }}
      renderLabel={({ route, focused }) => (
        <MyText style={{ color: focused ? Colors[colorScheme].tint : Colors[colorScheme].textInactive, fontWeight: '400', fontSize: 14 }}>
          {route.title === 'VIVINAUT' && !isRootEnv ? 'Creators' : route.title}
        </MyText>
      )}
    />
  );
};

export default function SearchResultScreen({ navigation, route }: RootStackScreenProps<'SearchResultScreen'>) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();
  const authToken = useReduxStateSelector((s) => s.account?.authToken);

  const { searchKeyword, defaultResultTab } = route.params;
  const [tab, setTab] = useState(defaultResultTab || SearchResultTabIndex.DEFAULT); // tab index

  const [selectedBranch, setSelectedBranch] = useState<Branch>();
  const [branches, setBranches] = useState<Branch[]>([]);
  const snapPoints = useMemo(() => ['45%'], []);
  const bottomSheetRef = useRef<BottomSheet>();

  // fetch branches for search filter
  const fetchBranches = useCallback(async () => {
    try {
      const res = await BranchApi.getList({ authToken });
      setBranches(res.data.branches);
    } catch (err) {
      console.warn(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Scene = useCallback(
    ({ route: tabRoute, jumpTo }: SceneProps) => {
      switch (tabRoute.key) {
        case 'All':
          return <DefaultSearchResultTab searchKeyword={searchKeyword} jumpTo={jumpTo} />;
        case 'Badge':
          return <BadgeSearchResultTab searchKeyword={searchKeyword} />;
        case 'Challenge':
          return <ChallengeSearchResultTab searchKeyword={searchKeyword} />;
        case 'Project':
          return (
            <ProjectSearchResultTab
              searchKeyword={searchKeyword}
              selectedBranch={selectedBranch}
              openBranchBottomSheet={() => bottomSheetRef.current?.expand()}
            />
          );
        case 'VIVINAUT':
          return (
            <MemberSearchResultTab
              searchKeyword={searchKeyword}
              selectedBranch={selectedBranch}
              openBranchBottomSheet={() => bottomSheetRef.current?.expand()}
            />
          );
        case 'Event':
          return (
            <EventSearchResultTab
              searchKeyword={searchKeyword}
              selectedBranch={selectedBranch}
              openBranchBottomSheet={() => bottomSheetRef.current?.expand()}
            />
          );
        // to add more routes
        default:
          return <View style={{ flex: 1 }} />;
      }
    },
    [searchKeyword, selectedBranch],
  );

  const onCancel = () => {
    navigation.navigate('Root');
  };

  const onSelectBranch = (branch: Branch) => {
    if (branch?.id !== selectedBranch?.id) setSelectedBranch(branch);
    else setSelectedBranch(null);
    bottomSheetRef.current?.close();
  };

  const onTabIndexChange = (index: number) => {
    setSelectedBranch(null);
    setTab(index);
  };

  useEffect(() => {
    ProjectReduxActions.addSearchHistory(searchKeyword);
  }, [searchKeyword]);

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ ...styles.container, paddingTop: insets.top, height: styles.searchHeader.height + insets.top }}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <TouchableOpacity
            style={[styles.searchInput, { backgroundColor: Colors[colorScheme].contentBackground }]}
            onPress={() => navigation.navigate('SearchScreen', { placeholder: searchKeyword })}
          >
            <MyText style={{ fontWeight: '400', fontSize: 15, marginTop: Platform.OS === 'ios' ? 3 : 0, marginLeft: 1 }}>{searchKeyword || 'Search'}</MyText>
          </TouchableOpacity>
          <Ionicons style={styles.iconStyle} name="ios-search-outline" size={15} color="#666" />
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <MyText style={{ fontSize: 16, fontWeight: '400', letterSpacing: 1, color: Colors[colorScheme].tint }}>Cancel</MyText>
        </TouchableOpacity>
      </View>
      <View style={[styles.contentContainer, { backgroundColor: SearchResultScreenColors[colorScheme].secondaryBackground }]}>
        <TabView
          navigationState={{ index: tab, routes }}
          onIndexChange={onTabIndexChange}
          renderScene={Scene}
          renderTabBar={MyTabBar}
          initialLayout={{ width: screen.width, height: 0 }}
          lazy
        />
      </View>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={MyBottomSheetBackdrop}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: Colors[colorScheme].contentBackground }]}
      >
        <View style={styles.contentTopRow}>
          <MyText style={{ fontSize: 14, padding: 6, color: '#aaa', fontWeight: '400' }}>FILTER BY BRANCH</MyText>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
          {branches.map((v) => (
            <TouchableOpacity key={`branch_${v.id}`} style={styles.branchListItem} onPress={() => onSelectBranch(v)}>
              <MyText style={{ fontSize: 16 }}>{CountryUtil.getCountryFlagEmoji(v.countryISO)}</MyText>
              <MyText style={selectedBranch?.id === v.id ? styles.selectedBranchText : styles.branchText}>{v.name}</MyText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheet>
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
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
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
    width: '100%',
  },
  bottomSheetBackground: {
    borderRadius: 8,
  },
  contentTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginBottom: 6,
  },
  scroll: {
    flex: 1,
    marginHorizontal: 12,
    borderTopColor: '#aaa',
    borderTopWidth: 1,
  },
  branchListItem: {
    height: 36,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchText: {
    color: '#aaa',
    fontSize: 15,
    marginLeft: 8,
  },
  selectedBranchText: {
    fontSize: 16,
    marginLeft: 8,
  },
});
