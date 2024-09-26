/* eslint-disable no-use-before-define */
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as Network from 'expo-network';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

import SystemApi from 'rn-viviboom/apis/viviboom/SystemApi';
import Config from 'rn-viviboom/constants/Config';

const checkingIntervalInMs = 10 * 60 * 1000; // 10 mins
const pollIntervalInMs = 60 * 1000; // 1 min

let prevCompleteCheckTime: number;
let pollingTimeout: NodeJS.Timeout;

/**
 * Note timeout does not run in background, thus repeat loop are set to per min, while we only actually run through the process if only 10 mins have passed.
 */
function AppVersionService() {
  useEffect(() => {
    if (Constants.appOwnership !== 'standalone') {
      return undefined;
    }
    if (Constants.manifest?.releaseChannel !== 'production') {
      return undefined;
    }

    checkVersionAsync();

    return () => {
      if (pollingTimeout) clearTimeout(pollingTimeout);
    };
  }, []);

  return null;
}

export default AppVersionService;

async function checkVersionAsync() {
  pollingTimeout = setTimeout(checkVersionAsync, pollIntervalInMs);

  if (prevCompleteCheckTime) {
    const diff = Math.abs(Date.now() - prevCompleteCheckTime);
    if (diff < checkingIntervalInMs) {
      return;
    }
  }

  if (!(await checkNetwork())) return;
  if (!(await checkIfBinaryVersionLatestAsync())) return;
  if (!(await checkIfOTAVersionLatestAsync())) return;

  prevCompleteCheckTime = Date.now();
}

async function checkNetwork() {
  const networkState = await Network.getNetworkStateAsync();
  if (!networkState?.isInternetReachable) {
    setTimeout(checkVersionAsync, 10000);
    return false;
  }
  return true;
}

async function checkIfOTAVersionLatestAsync() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'New updates!',
        `Viviboom mobile will now reload to bring you the latest version(${update.manifest.runtimeVersion as string}).`,
        [
          {
            text: 'Ok',
            onPress: () => {
              Updates.reloadAsync();
            },
          },
        ],
        { cancelable: false },
      );
      return false;
    }
  } catch (e) {
    console.log(e);
  }
  return true;
}

async function checkIfBinaryVersionLatestAsync() {
  const res = await SystemApi.getAppVersion();
  const { minVersion, recommendedVersion, recommendedMessage } = res.data;
  const { version } = Constants.manifest;
  const appVersionArr = version.split('.');
  const minVersionArr = minVersion.split('.');
  const recommendedVersionArr = recommendedVersion.split('.');

  // Min version check
  for (let i = 0; i < 2; i += 1) {
    if (parseInt(minVersionArr[i], 10) > parseInt(appVersionArr[i], 10)) {
      showUpdateRequiredDialog(recommendedVersion, recommendedMessage, false);
      return false;
    }
    if (parseInt(minVersionArr[i], 10) < parseInt(appVersionArr[i], 10)) {
      break;
    }
  }

  // Recommended version check
  for (let i = 0; i < 2; i += 1) {
    if (parseInt(recommendedVersionArr[i], 10) > parseInt(appVersionArr[i], 10)) {
      showUpdateRequiredDialog(recommendedVersion, recommendedMessage, true);
      return false;
    }
    if (parseInt(recommendedVersionArr[i], 10) < parseInt(appVersionArr[i], 10)) {
      break;
    }
  }

  return true;
}

function showUpdateRequiredDialog(recommendedVersion: string, recommendedMessage: string, cancelable: boolean) {
  Alert.alert(
    `Update your app version in the ${Platform.select({ ios: 'App', android: 'Play' })} Store!`,
    recommendedMessage || `Your app is out of date. Get the new version(${recommendedVersion}) now!`,
    [
      {
        text: 'Go to store',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL(Config.AppleAppStoreUrl);
          } else if (Platform.OS === 'android') {
            Linking.openURL(Config.GooglePlayStoreUrl);
          } else {
            Linking.openURL(Config.FrontEndUrl);
          }
          if (!cancelable) {
            showUpdateRequiredDialog(recommendedVersion, recommendedMessage, cancelable);
          }
        },
      },
    ],
    { cancelable },
  );
}
