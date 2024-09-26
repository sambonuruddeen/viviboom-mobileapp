import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import ChannelListTabScreen from './chatBottomTab/ChannelListTabScreen';
import GroupTabScreen from './chatBottomTab/GroupTabScreen';
import ContactTabScreen from './chatBottomTab/MentionTabScreen';
import { ChatRootTabParamList } from './types';

const BottomTab = createBottomTabNavigator<ChatRootTabParamList>();

export default function ChatBottomTabNavigator() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: '' });

  return (
    <BottomTab.Navigator
      initialRouteName="ChannelListTabScreen"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
      }}
    >
      <BottomTab.Screen
        name="ChannelListTabScreen"
        component={ChannelListTabScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
          title: t('Chats'),
        }}
      />
      <BottomTab.Screen
        name="MentionTabScreen"
        component={ContactTabScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => <Ionicons name="at-circle" size={size} color={color} />,
          title: t('Mentions'),
        }}
      />
      <BottomTab.Screen
        name="GroupTabScreen"
        component={GroupTabScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => <Ionicons name="people" size={size} color={color} />,
          title: t('Channels'),
        }}
      />
    </BottomTab.Navigator>
  );
}
