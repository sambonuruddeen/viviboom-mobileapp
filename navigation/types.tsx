/* eslint-disable prettier/prettier *//* eslint-disable linebreak-style */
/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ChatRootStackParamList } from 'rn-viviboom/screens/stack/chat/types';

declare global {
  namespace ReactNavigation {
    type RootParamList = RootStackParamList;
  }
}

export type RootTabParamList = {
  ProjectListTabScreen: { tab?: number };
  BadgeTabScreen: undefined;
  CreateProjectTabScreen: undefined;
  EventTabScreen: undefined;
  ProfileTabScreen: undefined;
};

export type VivivaultTreasureHuntStackParamList = {
  VTHLandingScreen: undefined;
  VTHHomeScreen: undefined;
  VTHSpaceSearchScreen: { foundId?: number };
  VTHPuzzleScreen: { isCompleted?: boolean };
  VTHWorldTravelScreen: { foundId?: number };
  VTHFinalQuestScreen: undefined;
};

export type BuilderPalStackParamList = {
  BuilderPalHomeScreen: undefined;
  BuilderPalSearchScreen: undefined;
  BuilderPalChatScreen: { chatId?: number };
  BuilderPalChallengeListScreen: { chatId: number };
  BuilderPalProjectListScreen: { chatId: number };
  BuilderPalRelatedProjectListScreen: { chatId: number };
  BuilderPalProjectScreen: { chatId: number, chatProjectId: number };
};

export type RootStackParamList = {
  LandingScreen: undefined;
  InstitutionSearchScreen: undefined;
  SignUpCodeScreen: undefined;
  LoginScreen: undefined;
  ForgetPasswordScreen: undefined;
  SignUpScreen: undefined;
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  Chat: NavigatorScreenParams<ChatRootStackParamList> | undefined;
  WelcomeScreen: undefined;
  ThingsToDoScreen: undefined;
  AddProfileScreen: undefined;
  SearchScreen: { placeholder: string; defaultResultTab?: number };
  SearchResultScreen: { searchKeyword: string; defaultResultTab: number };
  NotificationListScreen: { filter?: string };
  PresentNotificationScreen: { notifToPresent: Notification; onComplete: () => undefined };
  ProjectScreen: { preloadedData?: Project; showCommentSection?: boolean };
  CommentScreen: { preloadedData?: ProjectComment };
  ChallengeScreen: { preloadedData?: Badge };
  BadgeScreen: { preloadedData?: Badge };
  StarterCriteriaScreen: undefined;
  MemberScreen: { preloadedData?: User; tab?: number; projectTab?: string };
  EventScreen: { preloadedData?: MyEvent };
  EventListScreen: { type?: string; branchId?: number };
  EventQuestionScreen: { event: MyEvent };
  EventCalendarScreen: { branch?: Branch };
  MyBookingScreen: undefined;
  BookingSuccessScreen: { booking: UserEventBooking; event: MyEvent };
  AddProjectMediaScreen: undefined;
  MediaCarouselScreen: { preloadedData?: Project };
  CreateProjectScreen: undefined;
  SelectThumbnailScreen: undefined;
  SettingScreen: undefined;
  SelectBadgeModalScreen: { isChallenge?: boolean };
  ReportModalScreen: { relevantId: number; relevantType: string };
  CameraScannerScreen: undefined;
  BLEScreen: { code?: string };
  GameListScreen: undefined;
  VivivaultTreasureHuntRoot: NavigatorScreenParams<VivivaultTreasureHuntStackParamList> | undefined;
  BuilderPalRoot: NavigatorScreenParams<BuilderPalStackParamList> | undefined;
  Modal: undefined;
  NotFound: { title: string };
  TransactionResultScreen: { transactionId: number; username: string };
  TransactionScreen: { userId: number };
  TransactionListScreen: undefined;
  RewardResultScreen: { transactionId: number };
  EWalletScreen: undefined;
  MyQRScreen: undefined;
  RecipientListScreen: undefined;
  RewardScreen: { code?: string };
  UserProfileEditScreen: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, Screen>;

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;

export type VivivaultTreasureHuntStackScreenProps<Screen extends keyof VivivaultTreasureHuntStackParamList> = NativeStackScreenProps<
  VivivaultTreasureHuntStackParamList,
  Screen
>;

export type BuilderPalStackScreenProps<Screen extends keyof BuilderPalStackParamList> = NativeStackScreenProps<
  BuilderPalStackParamList,
  Screen
>;
