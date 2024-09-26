import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import BranchApi from 'rn-viviboom/apis/viviboom/BranchApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

interface SelectBranchBottomSheetModalProps {
  selectedBranch: Branch;
  onSelectBranch: (branch: Branch) => void;
}

const SelectBranchBottomSheetModal = forwardRef<BottomSheetModal, SelectBranchBottomSheetModalProps>(({ selectedBranch, onSelectBranch }, ref) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((s) => s.account);

  const [branches, setBranches] = useState<Branch[]>([]);
  const snapPoints = useMemo(() => ['50%'], []);

  // fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await BranchApi.getList({ authToken: user?.authToken });
      setBranches(res.data.branches);
    } catch (err) {
      console.warn(err);
    }
  }, [user?.authToken]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={MyBottomSheetBackdrop}
      backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: Colors[colorScheme].contentBackground }]}
    >
      <View style={styles.contentTopRow}>
        <MyText style={{ fontSize: 14, padding: 6, color: '#aaa', fontWeight: '400' }}>{t('Find Event In Branch')}</MyText>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.branchListItem} onPress={() => onSelectBranch(null)}>
          <MyText style={{ fontSize: 16 }}>🌎</MyText>
          <MyText style={!selectedBranch ? styles.selectedBranchText : styles.branchText}>{t('All Branches')}</MyText>
        </TouchableOpacity>
        {branches.map((v) => (
          <TouchableOpacity key={`branch_${v.id}`} style={styles.branchListItem} onPress={() => onSelectBranch(v)}>
            <MyText style={{ fontSize: 16 }}>{CountryUtil.getCountryFlagEmoji(v.countryISO)}</MyText>
            <MyText style={selectedBranch?.id === v.id ? styles.selectedBranchText : styles.branchText}>{v.name}</MyText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BottomSheetModal>
  );
});

export default SelectBranchBottomSheetModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
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
