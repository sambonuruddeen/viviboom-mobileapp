import axios from 'axios';

import Config from '../../constants/Config';

interface BadgeGetList {
  authToken: string;
  order?: string;
  limit?: number;
  offset?: number;
}

interface BadgeGet {
  authToken: string;
  badgeId: number;
  verboseAttributes?: string[];
}

async function getList({ authToken, ...params }: BadgeGetList) {
  return axios.get<{ badges: Badge[] }>(`${Config.ApiBaseUrl}/v2/badge`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function get({ authToken, badgeId, ...params }: BadgeGet) {
  return axios.get<{ badge: Badge }>(`${Config.ApiBaseUrl}/v2/badge/${badgeId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

export default {
  getList,
  get,
};
