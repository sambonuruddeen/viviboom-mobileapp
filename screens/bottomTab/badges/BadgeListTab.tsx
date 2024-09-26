import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BadgeCategoryApi from 'rn-viviboom/apis/viviboom/BadgeCategoryApi';
import Colors from 'rn-viviboom/constants/Colors';
import { BadgeDifficultyType } from 'rn-viviboom/enums/BadgeDifficultyType';
import { BadgeOrderType } from 'rn-viviboom/enums/BadgeOrderType';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import BadgeReduxActions from 'rn-viviboom/redux/badge/BadgeReduxActions';

import BadgeList, { BadgeFilterType } from './BadgeList';

const difficultyFilters: BadgeFilterType['difficulty'][] = [
  { id: 0, name: 'Difficulty', value: undefined },
  { id: 1, name: 'Beginner', value: BadgeDifficultyType.BEGINNER },
  { id: 2, name: 'Intermediate', value: BadgeDifficultyType.INTERMEDIATE },
  { id: 3, name: 'Advanced', value: BadgeDifficultyType.ADVANCED },
];

const completionTimeFilters: BadgeFilterType['timeToComplete'][] = [
  { id: 0, name: 'Time To Complete' },
  { id: 1, name: 'Within an hour', lowerLimit: 1, upperLimit: 59 },
  { id: 2, name: 'Within a day', lowerLimit: 60, upperLimit: 1440 },
  { id: 3, name: 'More than a day', lowerLimit: 1441 },
];

const orderFilters: BadgeFilterType['order'][] = [
  { id: 0, name: 'Latest', value: BadgeOrderType.LATEST },
  { id: 1, name: 'Oldest', value: BadgeOrderType.OLDEST },
];

interface BadgeListTabProps {
  isChallenge?: boolean;
  showSearchBar?: boolean;
  isSelectBadge?: boolean;
  selectedBadges?: Badge[];
  setSelectedBadges?: (badges: Badge[]) => void;
}

export default function BadgeListTab({ isChallenge, showSearchBar, isSelectBadge, selectedBadges, setSelectedBadges }: BadgeListTabProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((s) => s.account?.authToken);

  const [searchKeywords, setSearchKeywords] = useState('');
  const [allBadgeCategories, setAllBadgeCategories] = useState<BadgeCategory[]>([]);
  const [category, setCategory] = useState({ id: 0, name: 'All Categories' });
  const [difficulty, setDifficulty] = useState(difficultyFilters[0]);
  const [timeToComplete, setTimeToComplete] = useState(completionTimeFilters[0]);
  const [order, setOrder] = useState(orderFilters[0]);

  const [modalType, setModalType] = useState('');

  const snapPoints = useMemo(() => [modalType === 'Categories' ? '60%' : '40%'], [modalType]);
  const bottomSheetRef = useRef<BottomSheetModal>();
  const searchRef = useRef<TextInput>();

  const handleClearFilter = () => {
    setCategory({ id: 0, name: 'All Categories' });
    setDifficulty(difficultyFilters[0]);
    setTimeToComplete(completionTimeFilters[0]);
    setOrder(orderFilters[0]);
  };

  const FilterHeader = useMemo(
    () => (
      <View style={styles.filterCategoryContainer}>
        {showSearchBar && (
          <View style={[styles.searchHeader, { backgroundColor: Colors[colorScheme].contentBackground }]}>
            <View style={styles.searchBar}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: Colors[colorScheme].textInput, color: Colors[colorScheme].text }]}
                placeholder="Search"
                onChangeText={setSearchKeywords}
                value={searchKeywords}
                ref={searchRef}
                returnKeyType="done"
                placeholderTextColor="#666"
              />
              <Ionicons style={styles.iconStyle} name="ios-search-outline" size={15} color={Colors[colorScheme].text} />
              {searchKeywords.length > 0 && (
                <TouchableOpacity style={styles.clearSearch} onPress={() => setSearchKeywords('')}>
                  <Ionicons name="ios-close" size={15} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        <ScrollView horizontal contentContainerStyle={styles.filterScroll} showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={{ ...styles.categoryNameContainer, backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].tint }}
            onPress={() => {
              bottomSheetRef.current?.present();
              setModalType('Categories');
            }}
          >
            <MyText style={{ ...styles.filterButtonText, color: Colors[colorScheme].tint }}>{category.name}</MyText>
            <Ionicons style={{ ...styles.filterButtonIcon, color: Colors[colorScheme].tint }} name="chevron-down" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ ...styles.categoryNameContainer, backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].tint }}
            onPress={() => {
              bottomSheetRef.current?.present();
              setModalType('Time To Complete');
            }}
          >
            <MyText style={{ ...styles.filterButtonText, color: Colors[colorScheme].tint }}>{timeToComplete.name}</MyText>
            <Ionicons style={{ ...styles.filterButtonIcon, color: Colors[colorScheme].tint }} name="chevron-down" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ ...styles.categoryNameContainer, backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].tint }}
            onPress={() => {
              bottomSheetRef.current?.present();
              setModalType('Difficulty');
            }}
          >
            <MyText style={{ ...styles.filterButtonText, color: Colors[colorScheme].tint }}>{difficulty.name}</MyText>
            <Ionicons style={{ ...styles.filterButtonIcon, color: Colors[colorScheme].tint }} name="chevron-down" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ ...styles.categoryNameContainer, backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].tint }}
            onPress={() => {
              bottomSheetRef.current?.present();
              setModalType('Order');
            }}
          >
            <MyText style={{ ...styles.filterButtonText, color: Colors[colorScheme].tint }}>{order.name}</MyText>
            <Ionicons style={{ ...styles.filterButtonIcon, color: Colors[colorScheme].tint }} name="chevron-down" size={20} />
          </TouchableOpacity>
        </ScrollView>
        {(!!category.id || !!difficulty.id || !!timeToComplete.id || !!order.id) && (
          <TouchableOpacity style={[styles.clearButton, { backgroundColor: Colors[colorScheme].background }]} onPress={() => handleClearFilter()}>
            <Ionicons style={{ color: '#666' }} name="ios-close-outline" size={24} />
          </TouchableOpacity>
        )}
      </View>
    ),
    [
      category.id,
      category.name,
      colorScheme,
      difficulty.id,
      difficulty.name,
      order.id,
      order.name,
      searchKeywords,
      showSearchBar,
      timeToComplete.id,
      timeToComplete.name,
    ],
  );

  const fetchBadgeCategories = useCallback(async () => {
    try {
      const res = await BadgeCategoryApi.getList({ authToken });
      const newBadgeCategories = [{ id: 0, name: 'All Categories', description: '' }, ...(res.data?.badgeCategories || [])];
      setAllBadgeCategories(newBadgeCategories);
      BadgeReduxActions.saveBadgeCategories(newBadgeCategories);
    } catch (err) {
      console.error(err);
    }
  }, [authToken]);

  useEffect(() => {
    fetchBadgeCategories();
  }, [fetchBadgeCategories]);

  return (
    <>
      <View style={styles.container}>
        <BadgeList
          isChallenge={isChallenge}
          searchKeywords={searchKeywords}
          category={category}
          difficulty={difficulty}
          order={order}
          timeToComplete={timeToComplete}
          ListHeaderComponent={FilterHeader}
          isSelectBadge={isSelectBadge}
          selectedBadges={selectedBadges}
          setSelectedBadges={setSelectedBadges}
        />
      </View>

      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          enableHandlePanningGesture
          backdropComponent={MyBottomSheetBackdrop}
          backgroundStyle={{ backgroundColor: Colors[colorScheme].contentBackground }}
          style={{ paddingHorizontal: 18 }}
        >
          <View style={styles.modalTopRow}>
            <MyText style={styles.filterTitle}>{modalType}</MyText>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
              <Ionicons size={24} name="ios-close-outline" color={Colors[colorScheme].textSecondary} />
            </TouchableOpacity>
          </View>
          {modalType === 'Categories' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.categoryListContainer, { paddingBottom: insets.bottom }]}>
              {allBadgeCategories.map((v) => {
                const isSelected = v.id === category.id;
                return (
                  <TouchableOpacity
                    key={`badge-category_${v.id}`}
                    style={[styles.categoryItem, { backgroundColor: isSelected ? Colors[colorScheme].tint : Colors[colorScheme].tintShadow }]}
                    onPress={() => {
                      setCategory(v);
                      bottomSheetRef.current?.close();
                    }}
                  >
                    <MyText style={{ ...styles.categoryText, color: isSelected ? Colors[colorScheme].textInverse : Colors[colorScheme].text }}>{v.name}</MyText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {modalType === 'Time To Complete' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom }]}>
              {completionTimeFilters.map((v) => {
                const isSelected = v.id === timeToComplete.id;
                return (
                  <TouchableOpacity
                    key={`badge-time_${v.id}`}
                    style={[styles.listItem, { backgroundColor: isSelected ? Colors[colorScheme].tint : Colors[colorScheme].contentBackground }]}
                    onPress={() => {
                      setTimeToComplete(v);
                      bottomSheetRef.current?.close();
                    }}
                  >
                    <MyText style={{ ...styles.listText, color: isSelected ? Colors[colorScheme].textInverse : Colors[colorScheme].text }}>
                      {v.name === modalType ? 'All' : v.name}
                    </MyText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {modalType === 'Difficulty' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom }]}>
              {difficultyFilters.map((v) => {
                const isSelected = v.id === difficulty.id;
                return (
                  <TouchableOpacity
                    key={`badge-difficulty_${v.id}`}
                    style={[styles.listItem, { backgroundColor: isSelected ? Colors[colorScheme].tint : Colors[colorScheme].contentBackground }]}
                    onPress={() => {
                      setDifficulty(v);
                      bottomSheetRef.current?.close();
                    }}
                  >
                    <MyText style={{ ...styles.listText, color: isSelected ? Colors[colorScheme].textInverse : Colors[colorScheme].text }}>
                      {v.name === modalType ? 'All' : v.name}
                    </MyText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {modalType === 'Order' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom }]}>
              {orderFilters.map((v) => {
                const isSelected = v.id === order.id;
                return (
                  <TouchableOpacity
                    key={`badge-order_${v.id}`}
                    style={[styles.listItem, { backgroundColor: isSelected ? Colors[colorScheme].tint : Colors[colorScheme].contentBackground }]}
                    onPress={() => {
                      setOrder(v);
                      bottomSheetRef.current?.close();
                    }}
                  >
                    <MyText style={{ ...styles.listText, color: isSelected ? Colors[colorScheme].textInverse : Colors[colorScheme].text }}>{v.name}</MyText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </>
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
    height: 55,
  },
  searchBar: {
    flex: 1,
    height: 35,
  },
  iconStyle: {
    position: 'absolute',
    left: 10,
    top: 10,
  },
  clearSearch: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  searchInput: {
    paddingLeft: 30,
    paddingRight: 10,
    width: '100%',
    height: '100%',
    borderRadius: 17.5,
    backgroundColor: '#f2f2f2',
  },
  filterCategoryContainer: {
    paddingHorizontal: 12,
  },
  filterScroll: {
    alignItems: 'center',
    paddingRight: 60,
    paddingVertical: 18,
  },
  categoryNameContainer: {
    height: 36,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.35,
    marginRight: 18,
    paddingLeft: 12,
    paddingRight: 8,
  },
  filterButtonText: {
    fontWeight: '400',
  },
  filterButtonIcon: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  clearButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 60,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 18,
    borderBottomColor: '#aaa',
    borderBottomWidth: 0.3,
    marginBottom: 18,
  },
  filterTitle: {
    fontSize: 20,
  },
  categoryListContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  listContainer: {
    width: '100%',
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 12,
    marginRight: 12,
  },
  categoryText: {
    fontWeight: '400',
    fontSize: 13,
  },
  listItem: {
    padding: 12,
    marginBottom: 18,
    borderRadius: 4,
  },
  listText: {
    fontWeight: '400',
  },
});
