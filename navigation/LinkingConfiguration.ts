/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */
import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { RootStackParamList } from './types';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'viviboom://', 'https://mobile.viviboom.co'],
  config: {
    initialRouteName: 'Root',
    screens: {
      Root: {
        screens: {
          ProjectListTabScreen: 'projects',
          BadgeTabScreen: 'badges',
          EventTabScreen: 'events',
        },
      },
      NotificationListScreen: 'notifications',
      AddProjectMediaScreen: 'submit-project',
      MyBookingScreen: 'my-bookings',
      EWalletScreen: 'wallet',
      RewardScreen: 'reward/:code',
      TransactionScreen: 'transaction/receiver/:userId',
      BLEScreen: 'vivivault/:code',
      ProjectScreen: {
        path: 'project/:preloadedData',
        parse: {
          preloadedData: (id) => ({ id }),
        },
      },
      BadgeScreen: {
        path: 'badge/:preloadedData',
        parse: {
          preloadedData: (id) => ({ id }),
        },
      },
      EventScreen: {
        path: 'event/:preloadedData',
        parse: {
          preloadedData: (id) => ({ id }),
        },
      },
      MemberScreen: {
        path: 'member/:preloadedData',
        parse: {
          preloadedData: (id) => ({ id }),
        },
      },
      Chat: {
        initialRouteName: 'ChatRoot',
        screens: {
          ChatRoot: {
            path: 'chat',
            exact: true,
          },
          ChannelScreen: 'chat/:type/:channelId',
        },
      },
      VivivaultTreasureHuntRoot: {
        initialRouteName: 'VTHHomeScreen',
        screens: {
          VTHHomeScreen: {
            path: 'vth',
            exact: true,
          },
          VTHSpaceSearchScreen: 'vth/space-search/:foundId',
          VTHPuzzleScreen: 'vth/puzzle/:isCompleted',
          VTHWorldTravelScreen: 'vth/world-travel/:founId',
        },
      },
      NotFound: '*',
    },
  },
};

export default linking;
