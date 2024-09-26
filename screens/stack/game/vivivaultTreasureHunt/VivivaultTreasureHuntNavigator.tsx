import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackScreenProps, VivivaultTreasureHuntStackParamList } from 'rn-viviboom/navigation/types';

import VTHFinalQuestScreen from './VTHFinalQuestScreen';
import VivivaultTreasureHuntScreen from './VTHHomeScreen';
import VTHLandingScreen from './VTHLandingScreen';
import VTHPuzzleScreen from './VTHPuzzleScreen';
import VTHSpaceSearchScreen from './VTHSpaceSearchScreen';
import VTHWorldTravelScreen from './VTHWorldTravelScreen';

const Stack = createNativeStackNavigator<VivivaultTreasureHuntStackParamList>();

export default function VivivaultTreasureHuntNavigator({ navigation }: RootStackScreenProps<'VivivaultTreasureHuntRoot'>) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="VTHHomeScreen" component={VivivaultTreasureHuntScreen} />
      <Stack.Screen name="VTHLandingScreen" component={VTHLandingScreen} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
      <Stack.Screen name="VTHSpaceSearchScreen" component={VTHSpaceSearchScreen} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
      <Stack.Screen name="VTHPuzzleScreen" component={VTHPuzzleScreen} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
      <Stack.Screen name="VTHWorldTravelScreen" component={VTHWorldTravelScreen} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
      <Stack.Screen name="VTHFinalQuestScreen" component={VTHFinalQuestScreen} options={{ headerShown: false, animation: 'fade_from_bottom' }} />
    </Stack.Navigator>
  );
}
