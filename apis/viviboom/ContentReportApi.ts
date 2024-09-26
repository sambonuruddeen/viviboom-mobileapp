import axios from 'axios';

import Config from '../../constants/Config';

async function post({ authToken, relevantId, relevantType, reason, ...rest }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/content-report`,
    {
      relevantId,
      relevantType,
      reason,
      ...rest,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

export default {
  post,
};
