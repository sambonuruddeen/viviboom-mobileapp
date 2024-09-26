import axios from 'axios';

import Config from '../../constants/Config';

async function get({ authToken, code }: { authToken: string; code: string; }) {
  return axios.get<{ vault: Vault }>(`${Config.ApiBaseUrl}/v2/vault/${code}`, {
    headers: { 'auth-token': authToken },
  });
}

async function getList({ authToken, ...params }) {
  return axios.get<{ vaults: Array<Vault> }>(`${Config.ApiBaseUrl}/v2/vault`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

export default {
  get,
  getList,
};
