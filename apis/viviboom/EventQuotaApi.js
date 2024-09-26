import axios from "axios";
import Config from '../../constants/Config';

async function getList({ authToken, ...params }) {
  return axios.get(`${Config.ApiBaseUrl}/v2/event-quota`, { 
    headers: { 'auth-token': authToken },
    params: params
  });
}

export default {
  getList
}