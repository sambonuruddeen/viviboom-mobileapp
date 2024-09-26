import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import Colors from 'rn-viviboom/constants/Colors';
import MemberListItem from 'rn-viviboom/hoc/MemberListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CountryUtil from 'rn-viviboom/utils/CountryUtil';

const DEFAULT_MEMBER_REQUEST_COUNT = 10;

const filters = [
  { key: 'Last Joined', params: { orderKey: 'createdAt', orderDirection: 'DESC' } },
  { key: 'First Joined', params: { orderKey: 'createdAt', orderDirection: 'ASC' } },
  { key: 'A-Z', params: { orderKey: 'givenName', orderDirection: 'ASC' } },
  { key: 'Z-A', params: { orderKey: 'givenName', orderDirection: 'DESC' } },
];

interface MemberSearchResultTabProps {
  searchKeyword: string;
  selectedBranch: Branch;
  openBranchBottomSheet: () => void;
}

export default function MemberSearchResultTab({ searchKeyword, selectedBranch, openBranchBottomSheet }: MemberSearchResultTabProps) {
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);

  const [selectedFilterKey, setSelectedFilterKey] = useState(filters[0].key);

  const [members, setMembers] = useState<User[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isEndOfMembers, setIsEndOfMembers] = useState(false);

  const fetchMembers = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingMembers) return;
      if (!hardRefresh && isEndOfMembers) return;
      if (hardRefresh) setIsEndOfMembers(false);
      setIsFetchingMembers(true);

      const requestParams = {
        authToken,
        limit: DEFAULT_MEMBER_REQUEST_COUNT,
        offset: hardRefresh ? 0 : members.length,
        username: searchKeyword,
        branchId: selectedBranch ? selectedBranch.id : undefined,
        orderKey: 'givenName',
        orderDirection: 'ASC',
        ...(filters.find((f) => f.key === selectedFilterKey).params || {}),
      };

      try {
        const res = await UserApi.getList(requestParams);
        if (hardRefresh) {
          setMembers(res.data.users);
        } else {
          setMembers([...members, ...res.data.users]);
        }
        if (res.data.users.length < DEFAULT_MEMBER_REQUEST_COUNT) {
          setIsEndOfMembers(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingMembers(false);
    },
    [authToken, isEndOfMembers, isFetchingMembers, members, searchKeyword, selectedBranch, selectedFilterKey],
  );

  useEffect(() => {
    const init = () => {
      fetchMembers(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword, selectedBranch, selectedFilterKey]);

  const flatListHeaderComponent = useMemo(
    () => (
      <View style={[styles.listHeader, { backgroundColor: Colors[colorScheme].contentBackground }]}>
        <View style={styles.filterHeader}>
          <View style={styles.orderContainer}>
            {filters.map((filter) => (
              <TouchableOpacity key={`filter_${filter.key}`} style={styles.filterButton} onPress={() => setSelectedFilterKey(filter.key)}>
                <MyText style={{ ...styles.filterButtonText, color: selectedFilterKey === filter.key ? '#7353ff' : '#666' }}>{filter.key}</MyText>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.countryFilter} activeOpacity={0.8} onPress={openBranchBottomSheet}>
            {selectedBranch ? (
              <MyText style={styles.countryText}>
                {CountryUtil.getCountryFlagEmoji(selectedBranch.countryISO)} {selectedBranch.name}
              </MyText>
            ) : (
              <>
                <MyText style={styles.countryText}>Branch</MyText>
                <Ionicons name="ios-flag-outline" size={14} color="#666" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    ),
    [colorScheme, openBranchBottomSheet, selectedBranch, selectedFilterKey],
  );

  const flatListRenderItem = useCallback(
    ({ item, index }) => (
      <View style={{ backgroundColor: Colors[colorScheme].contentBackground }}>
        <MemberListItem id={item.id} preloadedData={item} />
      </View>
    ),
    [colorScheme],
  );

  return (
    <FlatList
      ListHeaderComponent={flatListHeaderComponent}
      ListFooterComponent={
        !isEndOfMembers ? null : (
          <MyText style={styles.noItemFoundText}>{!isFetchingMembers && !members.length ? 'No result found' : 'Yay! You have seen it all!'}</MyText>
        )
      }
      data={members}
      renderItem={flatListRenderItem}
      onEndReached={() => fetchMembers(false)}
      refreshing={isFetchingMembers}
      onRefresh={() => fetchMembers(true)}
      keyExtractor={(item) => `member-result_${item.id}`}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  titleText: {
    fontWeight: '400',
    fontSize: 15,
    marginLeft: 6,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  listHeader: {
    width: '100%',
  },
  filterHeader: {
    height: 40,
    width: '100%',
    borderBottomColor: 'rgba(160, 160, 160, 0.2)',
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  orderContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  filterButton: {
    marginRight: 18,
  },
  filterButtonText: {
    fontWeight: '400',
    fontSize: 12,
    color: '#666',
  },
  countryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftColor: '#ddd',
    borderLeftWidth: 1,
  },
  countryText: {
    fontWeight: '400',
    fontSize: 14,
    color: '#666',
    marginRight: 4,
    marginLeft: 12,
  },
});
