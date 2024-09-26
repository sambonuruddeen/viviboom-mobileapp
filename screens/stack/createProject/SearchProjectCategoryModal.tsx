/* eslint-disable indent */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSchemeName, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProjectCategoryApi from 'rn-viviboom/apis/viviboom/ProjectCategoryApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const SearchProjectCategoryModalColors: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    textInput: '#fff',
  },
  dark: {
    textInput: '#333',
  },
};
interface SearchProjectCategoryModalProps {
  show: boolean;
  handleClose: () => void;
  projectCategories: ProjectCategory[];
  onAddCategory: (category: ProjectCategory) => void;
}

export default function SearchProjectCategoryModal({ show, handleClose, projectCategories, onAddCategory }: SearchProjectCategoryModalProps) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const authToken = useReduxStateSelector((s) => s.account?.authToken);
  const insets = useSafeAreaInsets();

  const inputRef = useRef<TextInput>();

  const [allProjectCategories, setAllProjectCategories] = useState<ProjectCategory[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // API calls
  const fetchProjectCategories = useCallback(async () => {
    try {
      const res = await ProjectCategoryApi.getList({ authToken });
      setAllProjectCategories(res.data?.projectCategories);
    } catch (err) {
      console.error(err);
    }
  }, [authToken]);

  const onCancel = useCallback(() => {
    inputRef.current?.blur();
    handleClose();
  }, [handleClose]);

  const onSelect = useCallback(
    (pc: ProjectCategory) => () => {
      inputRef.current?.blur();
      onAddCategory(pc);
      handleClose();
    },
    [onAddCategory, handleClose],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!projectCategories) fetchProjectCategories();
    else setAllProjectCategories(projectCategories);
  }, [fetchProjectCategories, projectCategories]);

  return (
    <Modal animationType="fade" transparent visible={show} hardwareAccelerated onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <View
          style={[
            styles.searchHeader,
            { paddingTop: insets.top, height: styles.searchHeader.height + insets.top, backgroundColor: Colors[colorScheme].secondaryBackground },
          ]}
        >
          <View style={styles.searchBar}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: SearchProjectCategoryModalColors[colorScheme].textInput, color: Colors[colorScheme].text }]}
              placeholder="Search"
              ref={inputRef}
              onChangeText={setSearchKeyword}
              placeholderTextColor="#aaa"
              returnKeyType="search"
              autoFocus
            />
            <Ionicons style={styles.iconStyle} name="ios-search-outline" size={15} color="#aaa" />
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <MyText style={{ fontSize: 16, fontWeight: '400', letterSpacing: 1, color: Colors[colorScheme].tint }}>Cancel</MyText>
          </TouchableOpacity>
        </View>
        <View style={styles.contentContainer}>
          {searchKeyword
            ? allProjectCategories
                .filter((pc) => pc.name.toLowerCase().match(searchKeyword.toLowerCase()))
                .map((pc) => (
                  <TouchableOpacity key={`search-project-category_${pc.id}`} style={styles.projectCategoryItem} onPress={onSelect(pc)}>
                    <Chip style={[styles.categoryChip, { backgroundColor: Colors[colorScheme].textInput }]}>
                      <Ionicons name="ios-pricetag-outline" size={16} color={Colors[colorScheme].text} />
                      <View style={{ paddingLeft: 5 }}>
                        <MyText style={{ fontWeight: '400', fontSize: 16 }}>{pc.name}</MyText>
                      </View>
                    </Chip>
                  </TouchableOpacity>
                ))
            : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    height: 45,
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
    backgroundColor: '#f2f2f2',
  },
  cancelButton: {
    height: 35,
    width: '20%',
    borderColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  projectCategoryItem: {
    width: '100%',
    padding: 10,
    alignItems: 'flex-start',
  },
  categoryChip: {
    height: 35,
    alignItems: 'flex-start',
  },
});
