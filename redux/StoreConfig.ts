import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnyAction, CombinedState, Reducer, Store, combineReducers, configureStore, nanoid } from '@reduxjs/toolkit';
import { Dispatch } from 'react';
import { ColorSchemeName } from 'react-native';
import { Persistor, persistReducer } from 'redux-persist';
import { encryptTransform } from 'redux-persist-transform-encrypt';
import persistStore from 'redux-persist/es/persistStore';
import thunk from 'redux-thunk';

import accountReducer from './account';
import badgeReducer from './badge';
import createProjectReducer from './createProject';
import eventReducer from './event';
import institutionReducer from './institution';
import notificationReducer from './notification';
import onboardingReducer from './onboarding';
import projectReducer from './project';
import settingReducer from './setting';
import vivivaultTreasureHuntReducer from './vivivaultTreasureHunt';
import walletReducer from './wallet';

// eslint-disable-next-line prettier/prettier
const encryptKey = String.fromCharCode(65, 117, 81, 84, 53, 72, 100, 104, 101, 122, 86, 116, 119, 79, 65, 73, 122, 97, 83, 122, 74, 72, 97, 113, 104, 108, 106, 95, 55, 108, 73, 121, 65, 105, 117, 108, 95, 51, 73);

interface IRootReducer {
  institution: Institution;
  account: User;
  createProject: {
    id?: number;
    authorUserId?: number;
    videos: MediaInfo[];
    images: MediaInfo[];
    newItemIndex: number;
    isSavingMedia: boolean;
    prevVideos: MediaInfo[];
    prevImages: MediaInfo[];

    name: string;
    description: string;
    thumbnailUri: string;
    isCompleted: boolean;
    content: string;
    files: Array<ProjectFile>;
    badges: Array<Badge>;
    projectCategories: Array<ProjectCategory>;
    authorUsers: Array<User>;
    prevBadges: Array<Badge>;
    prevProjectCategories: Array<ProjectCategory>;
    prevAuthorUsers: Array<User>;
  };
  project: {
    [userId: number]: {
      homeProjects: Project[];
      draftProjects: Project[];
      blockedProjectIds: number[];
      searchHistory: string[];
    };
  };
  badge: {
    starterBadges: Badge[];
    starterChallenges: Badge[];
    badges: Badge[];
    challenges: Badge[];
    randomizerItems: Badge[];
    badgeCategories: BadgeCategory[];
  };
  event: {
    homeEvents: MyEvent[];
    myBookings: UserEventBooking[];
  };
  vivivaultTreasureHunt: {
    [userId: number]: {
      firepit: boolean;
      spaceSearch: boolean;
      puzzle: boolean;
      worldTravel: boolean;
      finalQuest: boolean;
    };
  };
  onboarding: {
    landing: boolean;
    createProject: boolean;
    badge: boolean;
    event: boolean;
    profile: boolean;
    completeProject: boolean;
    projectBadge: boolean;
    chatWithBadgeChallengeCreator: boolean;
    chatWithChallengeBuilderPal: boolean;
    builderPalHome: boolean;
    projectComment: boolean;
  };
  notification: {
    all: AppNotification[];
    unpresented: AppNotification[];
  };
  wallet: {
    [userId: number]: {
      wallet: Wallet;
      recentTransactions: Transaction[];
      recentInteractedUsers: User[];
    };
  };
  setting: {
    colorScheme?: ColorSchemeName;
  };
}

export default class StoreConfig {
  static store: Store<IRootReducer, AnyAction>;
  static persistor: Persistor;
  static rootReducer: Reducer<CombinedState<IRootReducer>, AnyAction>;
  static dispatchStore: Dispatch<AnyAction> | Dispatch<any>;

  static async init() {
    let encryptSalt = await AsyncStorage.getItem('encryptSalt');
    if (!encryptSalt) {
      encryptSalt = nanoid();
      AsyncStorage.setItem('encryptSalt', encryptSalt);
    }

    const encryptor = encryptTransform({
      secretKey: `${encryptSalt}${encryptKey}`,
      onError: (e) => {
        console.log(`Redux persist encryptor error:\n${e}}`);
      },
    });

    const encryptConfig = (key: string) => ({
      timeout: 0,
      key,
      storage: AsyncStorage,
      transforms: [encryptor],
    });

    StoreConfig.rootReducer = combineReducers({
      institution: persistReducer(encryptConfig('institutionReducer'), institutionReducer),
      account: persistReducer(encryptConfig('accountReducer'), accountReducer),
      createProject: createProjectReducer,
      project: persistReducer(encryptConfig('projectReducer'), projectReducer),
      badge: persistReducer(encryptConfig('badgeReducer'), badgeReducer),
      event: persistReducer(encryptConfig('eventReducer'), eventReducer),
      vivivaultTreasureHunt: persistReducer(encryptConfig('vivivaultTreasureHuntReducer'), vivivaultTreasureHuntReducer),
      onboarding: persistReducer(encryptConfig('onboardingReducer'), onboardingReducer),
      notification: notificationReducer,
      wallet: persistReducer(encryptConfig('walletReducer'), walletReducer),
      setting: persistReducer(encryptConfig('settingReducer'), settingReducer),
    });

    const persistedReducer = persistReducer(encryptConfig('root'), StoreConfig.rootReducer);

    StoreConfig.store = configureStore({
      reducer: persistedReducer,
      middleware: [thunk],
    });

    StoreConfig.persistor = persistStore(StoreConfig.store);
    StoreConfig.dispatchStore = StoreConfig.store.dispatch as typeof StoreConfig.store.dispatch | Dispatch<any>;
  }
}

StoreConfig.init();

export type IReduxState = ReturnType<typeof StoreConfig.rootReducer>;
export type IAppDispatch = typeof StoreConfig.store.dispatch;
