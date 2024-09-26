import axios from 'axios';

import Config from '../../constants/Config';

async function getList({ authToken }) {
  return axios.get<{ branches: Branch[] }>(`${Config.ApiBaseUrl}/v2/branch`, {
    headers: { 'auth-token': authToken },
  });
}

async function getListPublic({ ...params }) {
  return axios.get<{ branches: Branch[] }>(`${Config.ApiBaseUrl}/v2/branch/public`, {
    params,
  });
}

async function getStarterBadgesChallenges({ authToken, branchId, ...params }) {
  return axios.get<{ badges: Badge[] }>(`${Config.ApiBaseUrl}/v2/branch/${branchId}/starter-badge`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

export default {
  getList,
  getListPublic,
  getStarterBadgesChallenges,
};
