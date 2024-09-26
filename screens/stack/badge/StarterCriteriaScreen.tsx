import { useEffect } from 'react';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import StarterCriteriaTab from 'rn-viviboom/screens/bottomTab/badges/StarterCriteriaTab';

export default function StarterCriteriaScreen({ navigation }: RootStackScreenProps<'StarterCriteriaScreen'>) {
  const colorScheme = useColorScheme();

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      title: '',
      headerTintColor: Colors[colorScheme].text,
    });
  }, [colorScheme, navigation]);

  return <StarterCriteriaTab isShowing />;
}
