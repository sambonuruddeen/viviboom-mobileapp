import axios from 'axios';
import Config from '../../constants/Config';

async function getAuthToken({ authToken }) {
  return axios.get<{ streamChatAuthToken: string }>(`${Config.ApiBaseUrl}/v2/stream-chat/authToken`, {
    headers: { 'auth-token': authToken },
  });
}

export default {
  getAuthToken,
};
