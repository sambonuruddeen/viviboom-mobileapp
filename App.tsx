import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { FontAwesome } from '@expo/vector-icons';
import 'expo-dev-client';
import * as Font from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import 'intl';
import 'intl/locale-data/jsonp/en';
import { useEffect, useState } from 'react';
import * as Clarity from 'react-native-clarity';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillFetch } from 'react-native-polyfill-globals/src/fetch';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as Sentry from 'sentry-expo';

import Config from './constants/Config';
import EnvironmentType from './enums/EnvironmentType';
import AppVersionService from './hoc/AppVersionService';
import PresentNotificationService from './hoc/PresentNotificationService';
import Navigation from './navigation/RootNavigator';
import StoreConfig from './redux/StoreConfig';
import './translations/i18n';

polyfillEncoding();
polyfillFetch();
polyfillReadableStream();

Sentry.init({
  dsn: Config.SentryDsn,
  debug: Config.Env !== EnvironmentType.Production, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

SplashScreen.preventAutoHideAsync();
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

if (Config.EnableOneSignal) {
  const OneSignal = require('react-native-onesignal').default;
  OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
    const notification = notificationReceivedEvent.getNotification();
    // Complete with null means don't show a notification.
    notificationReceivedEvent.complete(notification);
  });
}

export default function App() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    init();
    setTimeout(() => SplashScreen.hideAsync(), 1);
  }, []);

  const init = async () => {
    try {
      // Load fonts
      await Font.loadAsync({
        ...FontAwesome.font,
        VivitaBold: require('./assets/fonts/VIVITA-Bold.otf'),
        Titillium: require('./assets/fonts/Titillium-Regular.otf'),
        TitilliumSemiBold: require('./assets/fonts/Titillium-Semibold.otf'),
        TitilliumBold: require('./assets/fonts/Titillium-Bold.otf'),
        TitilliumBlack: require('./assets/fonts/Titillium-Black.otf'),
      });
    } catch (e) {
      // We might want to provide this error information to an error reporting service
      console.warn(e);
    } finally {
      setLoadingComplete(true);
    }

    if (Config.EnableOneSignal) {
      const OneSignal = require('react-native-onesignal').default;
      OneSignal.setAppId(Config.OneSignalAppId);
      OneSignal.promptForPushNotificationsWithUserResponse();
    }

    Clarity.initialize(Config.ClarityProjectId);
  };

  if (!isLoadingComplete || !StoreConfig.store || !StoreConfig.persistor) {
    return null;
  }
  return (
    <>
      <Provider store={StoreConfig.store}>
        <PersistGate loading={null} persistor={StoreConfig.persistor}>
          <SafeAreaProvider>
            <ActionSheetProvider>
              <Navigation />
            </ActionSheetProvider>
          </SafeAreaProvider>
          <PresentNotificationService />
        </PersistGate>
      </Provider>
      <AppVersionService />
    </>
  );
}
