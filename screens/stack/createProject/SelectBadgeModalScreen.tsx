import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';
import BadgeListTab from 'rn-viviboom/screens/bottomTab/badges/BadgeListTab';

export default function SelectBadgeModalScreen({ navigation, route }: RootStackScreenProps<'SelectBadgeModalScreen'>) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const { badges } = useReduxStateSelector((state) => state.createProject);
  const [selectedBadges, setSelectedBadges] = useState(badges || []);

  const onCancel = useCallback(() => {
    setSelectedBadges(badges);
    navigation.navigate('CreateProjectScreen');
  }, [badges, navigation]);

  const onDone = useCallback(() => {
    CreateProjectReduxActions.setProject({ badges: selectedBadges });
    navigation.navigate('CreateProjectScreen');
  }, [navigation, selectedBadges]);

  return (
    <View
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : undefined, backgroundColor: Colors[colorScheme].contentBackground }]}
    >
      <View style={styles.contentTopRow}>
        <MyButton style={styles.topButton} compact onPress={onCancel} mode="text">
          Cancel
        </MyButton>
        <MyText style={{ fontSize: 18, padding: 6 }}>Select {route.params?.isChallenge ? 'Challenges' : 'Badges'}</MyText>
        <MyButton style={styles.topButton} compact onPress={onDone} mode="text">
          Done
        </MyButton>
      </View>
      <BadgeListTab isChallenge={route.params?.isChallenge} showSearchBar isSelectBadge selectedBadges={selectedBadges} setSelectedBadges={setSelectedBadges} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentTopRow: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topButton: {
    width: 100,
    paddingVertical: 0,
  },
});
