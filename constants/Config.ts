import Constants, { ExecutionEnvironment } from 'expo-constants';

import EnvironmentType from '../enums/EnvironmentType';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const Config = {
  // Change below Env to swtich env in dev
  Env: EnvironmentType.Production,
  ApiBaseUrl: 'http://localhost:8080',
  FrontEndUrl: 'http://localhost:3028',
  MobileAppUrl: 'https://mobile.viviboom.co',
  CometChatAppId: 'CometChatAppId',
  CometChatRegion: 'eu',
  StreamChatAppKey: 'StreamChatAppKey',
  BuilderAppId: 'BuilderAppId',
  EnableOneSignal: !isExpoGo,
  OneSignalAppId: 'OneSignalAppId',
  AppleAppStoreUrl: 'https://apps.apple.com/sg/app/viviboom/id6443782527',
  GooglePlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.vivita.viviboom',
  SentryDsn: 'https://177459f8f3294e6e8b6eb1834e1b15cb@o4504048251305984.ingest.sentry.io/4504081714315264',
  ClarityProjectId: 'ClarityProjectId',
};

if (Config.Env === EnvironmentType.Release) {
  Config.ApiBaseUrl = 'https://release-api.viviboom.co';
  Config.FrontEndUrl = 'https://www.release.viviboom.co';
  Config.CometChatAppId = 'CometChatAppId';
  Config.BuilderAppId = 'BuilderAppId';
}

if (Config.Env === EnvironmentType.Production) {
  Config.ApiBaseUrl = 'https://api.viviboom.co';
  Config.FrontEndUrl = 'https://www.viviboom.co';
  Config.CometChatAppId = 'CometChatAppId';
  Config.BuilderAppId = 'BuilderAppId';
  Config.SentryDsn = 'https://2e6b10b1a5de436eb8f3c674e1434635@o4504048251305984.ingest.sentry.io/4504067891396608';
}

export default Config;
