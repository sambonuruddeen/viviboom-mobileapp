import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProjectCategoryApi from 'rn-viviboom/apis/viviboom/ProjectCategoryApi';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

import AddCategoryModal from './AddCategoryModal';
import SearchProjectCategoryModal from './SearchProjectCategoryModal';

interface CategoryBottomSheetProps {
  show: boolean;
  handleClose: () => void;
}

export default function CategoryBottomSheet({ show, handleClose }: CategoryBottomSheetProps) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();
  const authToken = useReduxStateSelector((s) => s.account?.authToken);

  const { projectCategories } = useReduxStateSelector((state) => state.createProject);

  const [showAddNewCategory, setShowAddNewCategory] = useState(false);
  const [showSearchCategory, setShowSearchCategory] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState(projectCategories || []);

  const [allProjectCategories, setAllProjectCategories] = useState<ProjectCategory[]>([]);
  const [isLoading, setLoading] = useState(false);

  const snapPoints = useMemo(() => ['60%', '95%'], []);
  const bottomSheetRef = useRef<BottomSheet>();

  // API calls
  const fetchProjectCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProjectCategoryApi.getList({ authToken });
      setAllProjectCategories(res.data?.projectCategories);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [authToken]);

  const onCancel = useCallback(() => {
    setSelectedCategories(projectCategories);
    handleClose();
  }, [projectCategories, handleClose]);

  const onDone = useCallback(() => {
    CreateProjectReduxActions.setProject({ projectCategories: selectedCategories });
    handleClose();
  }, [handleClose, selectedCategories]);

  const onAddCategory = useCallback(
    (category: ProjectCategory) => {
      setSelectedCategories(selectedCategories?.concat(category));
    },
    [selectedCategories],
  );

  const onDeleteCategory = useCallback(
    (categoryId: number) => () => {
      setSelectedCategories(selectedCategories?.filter((pc) => pc.id !== categoryId));
    },
    [selectedCategories],
  );

  useEffect(() => {
    if (show) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [show]);

  useEffect(() => {
    fetchProjectCategories();
  }, [fetchProjectCategories]);

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onClose={onCancel}
        enablePanDownToClose
        backdropComponent={MyBottomSheetBackdrop}
        backgroundStyle={{ backgroundColor: Colors[colorScheme].secondaryBackground }}
      >
        <View style={styles.contentTopRow}>
          <MyButton style={styles.topButton} compact onPress={onCancel} mode="text">
            Cancel
          </MyButton>
          <MyText style={{ fontSize: 18, padding: 6 }}>Select Categories</MyText>
          <MyButton style={styles.topButton} compact onPress={onDone} mode="text">
            Done
          </MyButton>
        </View>
        <ScrollView
          style={[styles.categoryScroll, { backgroundColor: Colors[colorScheme].contentBackground }]}
          contentContainerStyle={[styles.categoryContainer, { paddingBottom: insets.bottom + Layout.bottomNavigatorBarHeight }]}
        >
          <View style={styles.selectedCategories}>
            <MyText style={{ color: Colors[colorScheme].textInactive }}>Selected Categories ({selectedCategories?.length || 0})</MyText>
            <View style={styles.selectedChips}>
              {selectedCategories?.map((pc) => (
                <Chip
                  key={`selected-category_${pc.id}`}
                  style={styles.selectedCategoryChip}
                  onPress={onDeleteCategory(pc.id)}
                  textStyle={{ marginVertical: 0 }}
                  closeIcon={() => <Ionicons name="ios-close-outline" size={16} color="#fff" />}
                  onClose={onDeleteCategory(pc.id)}
                >
                  <MyText style={styles.selectedChipText}>{pc.name}</MyText>
                </Chip>
              ))}
              <TouchableOpacity style={styles.addNewCategory} onPress={() => setShowAddNewCategory(true)}>
                <Ionicons name="ios-add-outline" size={24} color={Colors[colorScheme].text} />
                <View>
                  <MyText style={{ fontWeight: '400', fontSize: 14 }}>New Tag</MyText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.allCategories}>
            <View style={styles.allCategoriesTopRow}>
              <MyText style={{ color: Colors[colorScheme].textInactive, marginTop: 5 }}>Pick some categories to tag your project</MyText>
              <TouchableOpacity onPress={() => setShowSearchCategory(true)}>
                <Ionicons name="search" size={18} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <ActivityIndicator size={24} style={{ margin: 20 }} />
            ) : (
              <View style={styles.chips}>
                {allProjectCategories.map((pc) => {
                  const isSelected = selectedCategories?.find((sc) => sc.id === pc.id);
                  return (
                    <Chip
                      key={`all-category_${pc.id}`}
                      style={[styles.categoryChip, { backgroundColor: isSelected ? '#8a71fd' : Colors[colorScheme].textInput }]}
                      onPress={() => {
                        if (!isSelected) onAddCategory(pc);
                      }}
                      textStyle={{ marginVertical: 0 }}
                    >
                      <MyText style={isSelected ? styles.selectedChipText : { ...styles.chipText, color: Colors[colorScheme].text }}>{pc.name}</MyText>
                    </Chip>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </BottomSheet>
      <AddCategoryModal show={showAddNewCategory} handleClose={() => setShowAddNewCategory(false)} onAddCategory={onAddCategory} />
      <SearchProjectCategoryModal
        show={showSearchCategory}
        handleClose={() => setShowSearchCategory(false)}
        projectCategories={allProjectCategories}
        onAddCategory={onAddCategory}
      />
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  contentTopRow: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topButton: {
    width: 100,
    paddingVertical: 0,
  },
  categoryScroll: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  categoryContainer: {
    padding: 12,
  },
  selectedCategories: {
    width: '100%',
  },
  selectedChips: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginVertical: 6,
  },
  categoryChip: {
    marginVertical: 5,
    marginRight: 10,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 2 : 0,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '400',
  },
  selectedChipText: {
    fontSize: 12,
    color: '#fff',
  },
  selectedCategoryChip: {
    marginVertical: 5,
    marginRight: 10,
    height: 30,
    backgroundColor: '#8a71fd',
    flexDirection: 'row',
  },
  allCategories: {
    width: '100%',
  },
  allCategoriesTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  addNewCategory: {
    marginVertical: 5,
    marginRight: 10,
    height: 30,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'gray',
    paddingLeft: 5,
    paddingRight: 10,
  },
});
