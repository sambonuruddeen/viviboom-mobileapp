import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';

import SelectBranchBottomSheetModal from 'rn-viviboom/hoc/SelectBranchBottomSheetModal';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootTabScreenProps } from 'rn-viviboom/navigation/types';

import EventList from './events/EventList';
import EventSearchHeader from './events/EventSearchHeader';

const DEFAULT_EVENT_TOP_HEIGHT = 78;

export default function EventTabScreen({ navigation }: RootTabScreenProps<'EventTabScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const user = useReduxStateSelector((s) => s.account);

  const [eventTopHeight, setEventTopHeight] = useState(DEFAULT_EVENT_TOP_HEIGHT);
  const [selectedBranch, setSelectedBranch] = useState<Branch>(user.branch);
  const bottomSheetRef = useRef<BottomSheetModal>();

  const offset = useRef(new Animated.Value(0)).current;

  return (
    <>
      <View style={styles.container}>
        <EventList
          branch={selectedBranch}
          offset={offset}
          setEventTopHeight={setEventTopHeight}
          openBranchBottomSheet={() => bottomSheetRef.current?.present()}
        />
        <EventSearchHeader
          navigation={navigation}
          branch={selectedBranch}
          offset={offset}
          eventTopHeight={eventTopHeight}
          openBranchBottomSheet={() => bottomSheetRef.current?.present()}
        />
      </View>
      <SelectBranchBottomSheetModal
        ref={bottomSheetRef}
        selectedBranch={selectedBranch}
        onSelectBranch={(branch) => {
          setSelectedBranch(branch);
          bottomSheetRef.current?.close();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
