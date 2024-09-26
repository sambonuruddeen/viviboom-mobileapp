import axios from 'axios';

import Config from '../../constants/Config';

async function getList({ authToken, ...params }) {
  return axios.get<{ badgeCategories: Array<BadgeCategory> }>(`${Config.ApiBaseUrl}/v2/badge-category`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

export default {
  getList,
};
