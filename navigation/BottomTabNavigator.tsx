import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import Colors from 'rn-viviboom/constants/Colors';
import MyTooltip from 'rn-viviboom/hoc/MyTooltip';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';
import OnboardingReduxActions from 'rn-viviboom/redux/onboarding/OnboardingReduxActions';
import BadgeTabScreen from 'rn-viviboom/screens/bottomTab/BadgeTabScreen';
import CreateProjectTabScreen from 'rn-viviboom/screens/bottomTab/CreateProjectTabScreen';
import EventTabScreen from 'rn-viviboom/screens/bottomTab/EventTabScreen';
import ProfileTabScreen from 'rn-viviboom/screens/bottomTab/ProfileTabScreen';
import ProjectListTabScreen from 'rn-viviboom/screens/bottomTab/ProjectTabScreen';

import { RootTabParamList } from './types';

const BottomTab = createBottomTabNavigator<RootTabParamList>();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();
  const onboarding = useReduxStateSelector((state) => state.onboarding);
  const [showHint, setShowHint] = useState<string>();

  useEffect(() => {
    // delay hint showing time
    if (!onboarding?.createProject) setTimeout(() => setShowHint('createProject'), 1500);
    if (!onboarding?.event) setTimeout(() => setShowHint('event'), 1500);
    if (!onboarding?.badge) setTimeout(() => setShowHint('badge'), 1500);
    if (!onboarding?.profile) setTimeout(() => setShowHint('profile'), 1500);
  }, []);

  return (
    <BottomTab.Navigator
      initialRouteName="ProjectListTabScreen"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarShowLabel: false,
        title: '',
      }}
    >
      <BottomTab.Screen
        name="ProjectListTabScreen"
        component={ProjectListTabScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => <Ionicons name="home" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <BottomTab.Screen
        name="BadgeTabScreen"
        component={BadgeTabScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MyTooltip
              isVisible={showHint === 'badge'}
              text="Earn a shiny badge here!"
              placement="top"
              onClose={() => {
                OnboardingReduxActions.save({ badge: true });
                setShowHint('');
              }}
            >
              <Ionicons name="ribbon" size={size} color={color} />
            </MyTooltip>
          ),
          headerShown: false,
        }}
      />
      <BottomTab.Screen
        name="CreateProjectTabScreen"
        component={CreateProjectTabScreen}
        options={{
          // tabBarIcon: ({ focused, color, size }) => <Ionicons name="add-circle" size={size} color={Colors[colorScheme].tint} />,
          tabBarButton: (props) => (
            <TouchableOpacity {...props}>
              <MyTooltip
                isVisible={showHint === 'createProject'}
                text="Create your first project here!"
                placement="top"
                onClose={() => {
                  OnboardingReduxActions.save({ createProject: true });
                  setShowHint('');
                }}
              >
                <Ionicons name="add-circle" size={44} color={Colors[colorScheme].tint} style={{ position: 'relative', top: -2 }} />
              </MyTooltip>
            </TouchableOpacity>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            CreateProjectReduxActions.clearAll();
            navigation.navigate('AddProjectMediaScreen');
          },
        })}
      />
      <BottomTab.Screen
        name="EventTabScreen"
        component={EventTabScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MyTooltip
              isVisible={showHint === 'event'}
              text="Book a visit to our event!"
              placement="top"
              onClose={() => {
                OnboardingReduxActions.save({ event: true });
                setShowHint('');
              }}
            >
              <Ionicons name="calendar" size={size} color={color} />
            </MyTooltip>
          ),
          headerShown: false,
        }}
      />
      <BottomTab.Screen
        name="ProfileTabScreen"
        component={ProfileTabScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MyTooltip
              isVisible={showHint === 'profile'}
              text="View your profile!"
              placement="top"
              onClose={() => {
                OnboardingReduxActions.save({ profile: true });
                setShowHint('');
              }}
            >
              <FontAwesome name="user" size={size} color={color} />
            </MyTooltip>
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}
