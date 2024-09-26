/* eslint-disable import/prefer-default-export */
import axios from 'axios';

import Config from '../../constants/Config';

async function getAppVersion() {
  return axios.get<{ minVersion: string; recommendedVersion: string; recommendedMessage: string }>(`${Config.ApiBaseUrl}/v2/mobile-app/version`);
}

export default {
  getAppVersion,
};
