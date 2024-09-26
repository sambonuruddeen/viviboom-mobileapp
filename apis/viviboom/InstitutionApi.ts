import axios from 'axios';

import Config from '../../constants/Config';

async function getList({ ...params }) {
  return axios.get<{ institutions: Array<Institution> }>(`${Config.ApiBaseUrl}/v2/institution/public`, {
    params,
  });
}

export default {
  getList,
};
