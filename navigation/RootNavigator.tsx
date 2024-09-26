/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { StatusBar } from 'expo-status-bar';
import JailMonkey from 'jail-monkey';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import CacheManager from 'rn-viviboom/hoc/CacheManager';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import AccountReduxActions from 'rn-viviboom/redux/account/AccountReduxActions';
import ForgetPasswordScreen from 'rn-viviboom/screens/auth/ForgetPasswordScreen';
import LoginScreen from 'rn-viviboom/screens/auth/LoginScreen';
import SignUpCodeScreen from 'rn-viviboom/screens/auth/SignUpCodeScreen';
import SignUpScreen from 'rn-viviboom/screens/auth/SignUpScreen';
import UserProfileEditScreen from 'rn-viviboom/screens/bottomTab/profile/UserProfileEditScreen';
import ModalScreen from 'rn-viviboom/screens/stack/ModalScreen';
import NotFoundScreen from 'rn-viviboom/screens/stack/NotFoundScreen';
import BadgeScreen from 'rn-viviboom/screens/stack/badge/BadgeScreen';
import StarterCriteriaScreen from 'rn-viviboom/screens/stack/badge/StarterCriteriaScreen';
import BuilderPalNavigator from 'rn-viviboom/screens/stack/builderPal/BuilderPalNavigator';
import BLEScreen from 'rn-viviboom/screens/stack/cameraScanner/BLEScreen';
import CameraScannerScreen from 'rn-viviboom/screens/stack/cameraScanner/CameraScannerScreen';
import ChallengeScreen from 'rn-viviboom/screens/stack/challenge/ChallengeScreen';
import ChatRootNavigator from 'rn-viviboom/screens/stack/chat/ChatRootNavigator';
import { ChatContext } from 'rn-viviboom/screens/stack/chat/context/ChatContext';
import { useChatClient } from 'rn-viviboom/screens/stack/chat/hooks/useChatClient';
import CreateProjectScreen from 'rn-viviboom/screens/stack/createProject/CreateProjectScreen';
import SelectBadgeModalScreen from 'rn-viviboom/screens/stack/createProject/SelectBadgeModalScreen';
import SelectThumbnailScreen from 'rn-viviboom/screens/stack/createProject/SelectThumbnailScreen';
import AddProjectMediaScreen from 'rn-viviboom/screens/stack/createProject/addProjectMedia/AddProjectMediaScreen';
import MediaCarouselScreen from 'rn-viviboom/screens/stack/createProject/addProjectMedia/MediaCarouselScreen';
import BookingSuccessScreen from 'rn-viviboom/screens/stack/event/BookingSuccessScreen';
import EventCalendarScreen from 'rn-viviboom/screens/stack/event/EventCalendarScreen';
import EventListScreen from 'rn-viviboom/screens/stack/event/EventListScreen';
import EventQuestionScreen from 'rn-viviboom/screens/stack/event/EventQuestionScreen';
import EventScreen from 'rn-viviboom/screens/stack/event/EventScreen';
import MyBookingScreen from 'rn-viviboom/screens/stack/event/MyBookingScreen';
import EWalletScreen from 'rn-viviboom/screens/stack/ewallet/EWalletScreen';
import MyQRScreen from 'rn-viviboom/screens/stack/ewallet/MyQRScreen';
import RecipientListScreen from 'rn-viviboom/screens/stack/ewallet/RecipientListScreen';
import RewardResultScreen from 'rn-viviboom/screens/stack/ewallet/RewardResultScreen';
import RewardScreen from 'rn-viviboom/screens/stack/ewallet/RewardScreen';
import TransactionListScreen from 'rn-viviboom/screens/stack/ewallet/TransactionListScreen';
import TransactionResultScreen from 'rn-viviboom/screens/stack/ewallet/TransactionResultScreen';
import TransactionScreen from 'rn-viviboom/screens/stack/ewallet/TransactionScreen';
import GameListScreen from 'rn-viviboom/screens/stack/game/GameListScreen';
import VivivaultTreasureHuntNavigator from 'rn-viviboom/screens/stack/game/vivivaultTreasureHunt/VivivaultTreasureHuntNavigator';
import MemberScreen from 'rn-viviboom/screens/stack/member/MemberScreen';
import NotificationListScreen from 'rn-viviboom/screens/stack/notification/NotificationListScreen';
import PresentNotificationScreen from 'rn-viviboom/screens/stack/notification/PresentNotificationScreen';
import CommentScreen from 'rn-viviboom/screens/stack/project/CommentScreen';
import ProjectScreen from 'rn-viviboom/screens/stack/project/ProjectScreen';
import ReportModalScreen from 'rn-viviboom/screens/stack/report/ReportModalScreen';
import SearchResultScreen from 'rn-viviboom/screens/stack/search/SearchResultScreen';
import SearchScreen from 'rn-viviboom/screens/stack/search/SearchScreen';
import SettingScreen from 'rn-viviboom/screens/stack/setting/SettingScreen';
import AddProfileScreen from 'rn-viviboom/screens/stack/welcome/AddProfileScreen';
import ThingsToDoScreen from 'rn-viviboom/screens/stack/welcome/ThingsToDoScreen';
import WelcomeScreen from 'rn-viviboom/screens/stack/welcome/WelcomeScreen';

import BottomTabNavigator from './BottomTabNavigator';
import LinkingConfiguration from './LinkingConfiguration';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef();

const checkingIntervalInMs = 10 * 60 * 1000; // 10 mins

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const loggedInUser = useReduxStateSelector((state) => state.account);
  const isRewardEnabled = !!loggedInUser?.branch?.allowVivicoinRewards && !!loggedInUser?.institution?.isRewardEnabled;

  useEffect(() => {
    let prevCompleteCheckTime: number;

    async function fetchUser() {
      // Detect Root
      if (JailMonkey.isJailBroken()) {
        Toast.show({
          text1: 'You are on a rooted device',
          text2: 'Please switch to a non-rooted device for app safety',
          type: 'error',
        });
      }

      if (!loggedInUser?.authToken) return;

      try {
        await AccountReduxActions.fetch();
      } catch (err) {
        if (err instanceof AxiosError && err.response.status === 401) {
          await AccountReduxActions.logout();
        }
      }
    }
    fetchUser();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (prevCompleteCheckTime) {
        const diff = Math.abs(Date.now() - prevCompleteCheckTime);
        if (diff < checkingIntervalInMs) {
          return;
        }
      }

      // Check if token is still valid
      if (nextAppState === 'active') {
        await fetchUser();
        prevCompleteCheckTime = Date.now();
        await CacheManager.pruneCache();
      }
    });
    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack.Navigator>
      {!loggedInUser?.authToken ? (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerTransparent: true, title: null }} />
          <Stack.Screen name="SignUpCodeScreen" component={SignUpCodeScreen} options={{ headerTransparent: true, title: null }} />
          <Stack.Screen name="ForgetPasswordScreen" component={ForgetPasswordScreen} options={{ headerTransparent: true }} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} options={{ headerTransparent: true }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatRootNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ animation: 'slide_from_bottom', headerShown: false }} />
          <Stack.Screen name="ThingsToDoScreen" component={ThingsToDoScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="AddProfileScreen" component={AddProfileScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="SearchScreen" component={SearchScreen} options={{ animation: 'fade', headerShown: false }} />
          <Stack.Screen name="SearchResultScreen" component={SearchResultScreen} options={{ animation: 'fade', headerShown: false }} />
          <Stack.Screen name="ProjectScreen" component={ProjectScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="CommentScreen" component={CommentScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="ChallengeScreen" component={ChallengeScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="BadgeScreen" component={BadgeScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="StarterCriteriaScreen" component={StarterCriteriaScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="MemberScreen" component={MemberScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="EventScreen" component={EventScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="EventListScreen" component={EventListScreen} />
          <Stack.Screen name="EventQuestionScreen" component={EventQuestionScreen} />
          <Stack.Screen name="EventCalendarScreen" component={EventCalendarScreen} />
          <Stack.Screen name="MyBookingScreen" component={MyBookingScreen} />
          <Stack.Screen name="BookingSuccessScreen" component={BookingSuccessScreen} options={{ animation: 'slide_from_bottom', headerShown: false }} />
          <Stack.Screen name="AddProjectMediaScreen" component={AddProjectMediaScreen} options={{ animation: 'slide_from_bottom', headerShown: false }} />
          <Stack.Screen name="MediaCarouselScreen" component={MediaCarouselScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="CreateProjectScreen" component={CreateProjectScreen} options={{ animation: 'slide_from_right', headerShown: false }} />
          <Stack.Screen name="SelectThumbnailScreen" component={SelectThumbnailScreen} options={{ animation: 'fade', headerShown: false }} />
          <Stack.Screen name="SettingScreen" component={SettingScreen} />
          <Stack.Screen name="NotificationListScreen" component={NotificationListScreen} />
          <Stack.Screen name="PresentNotificationScreen" component={PresentNotificationScreen} options={{ animation: 'fade', headerShown: false }} />
          <Stack.Screen name="UserProfileEditScreen" component={UserProfileEditScreen} />
          {isRewardEnabled && (
            <>
              <Stack.Screen name="EWalletScreen" component={EWalletScreen} />
              <Stack.Screen name="RecipientListScreen" component={RecipientListScreen} />
              <Stack.Screen name="TransactionScreen" component={TransactionScreen} options={{ headerTransparent: true, title: null }} />
              <Stack.Screen name="TransactionResultScreen" component={TransactionResultScreen} options={{ headerShown: false }} />
              <Stack.Screen name="RewardScreen" component={RewardScreen} options={{ headerTransparent: true, title: null }} />
              <Stack.Screen name="RewardResultScreen" component={RewardResultScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="MyQRScreen" component={MyQRScreen} />
              <Stack.Screen name="TransactionListScreen" component={TransactionListScreen} options={{ headerTitle: 'My Transactions' }} />
            </>
          )}
          {loggedInUser?.institution?.isVaultEnabled && (
            <>
              <Stack.Screen name="BLEScreen" component={BLEScreen} options={{ headerTransparent: true, title: null }} />
              <Stack.Group>
                <Stack.Screen name="GameListScreen" component={GameListScreen} />
                <Stack.Screen name="VivivaultTreasureHuntRoot" component={VivivaultTreasureHuntNavigator} options={{ headerShown: false }} />
              </Stack.Group>
            </>
          )}
          {(loggedInUser?.institution?.isVaultEnabled || isRewardEnabled) && (
            <>
              <Stack.Screen name="CameraScannerScreen" component={CameraScannerScreen} options={{ headerTransparent: true, title: null }} />
            </>
          )}

          {loggedInUser?.institution?.isBuilderPalEnabled && (
            <Stack.Screen name="BuilderPalRoot" component={BuilderPalNavigator} options={{ headerShown: false }} />
          )}
          <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="SelectBadgeModalScreen" component={SelectBadgeModalScreen} options={{ animation: 'slide_from_bottom', headerShown: false }} />
            <Stack.Screen name="ReportModalScreen" component={ReportModalScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Modal" component={ModalScreen} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const colorScheme = useColorScheme();
  const chatClientValue = useChatClient();

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <NavigationContainer ref={navigationRef} linking={LinkingConfiguration} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ChatContext.Provider value={chatClientValue}>
              <RootNavigator />
            </ChatContext.Provider>
          </NavigationContainer>
          <StatusBar style={colorScheme === 'light' ? 'dark' : 'light'} />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
      <Toast position="bottom" />
    </>
  );
}
