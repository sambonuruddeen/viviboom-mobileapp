import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BuilderPalStackParamList, RootStackScreenProps } from 'rn-viviboom/navigation/types';

import BuilderPalChallengeListScreen from './BuilderPalChallengeListScreen';
import BuilderPalChatScreen from './BuilderPalChatScreen';
import BuilderPalHomeScreen from './BuilderPalHomeScreen';
import BuilderPalProjectListScreen from './BuilderPalProjectListScreen';
import BuilderPalProjectScreen from './BuilderPalProjectScreen';
import BuilderPalRelatedProjectListScreen from './BuilderPalRelatedProjectListScreen';
import BuilderPalSearchScreen from './BuilderPalSearchScreen';

const Stack = createNativeStackNavigator<BuilderPalStackParamList>();

export default function BuilderPalNavigator({ navigation }: RootStackScreenProps<'BuilderPalRoot'>) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BuilderPalHomeScreen" component={BuilderPalHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BuilderPalChatScreen" component={BuilderPalChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BuilderPalSearchScreen" component={BuilderPalSearchScreen} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="BuilderPalChallengeListScreen" component={BuilderPalChallengeListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BuilderPalProjectListScreen" component={BuilderPalProjectListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BuilderPalRelatedProjectListScreen" component={BuilderPalRelatedProjectListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BuilderPalProjectScreen" component={BuilderPalProjectScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
