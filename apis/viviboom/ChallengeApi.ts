import axios from 'axios';

import Config from '../../constants/Config';

interface getChallengeList {
  authToken: string;
  order?: string;
  limit?: number;
  offset?: number;
}

interface getChallenge {
  authToken: string;
  challengeId: number;
  verboseAttributes?: Array<string>;
}

async function getList({ authToken, ...params }: getChallengeList) {
  return axios.get<{ challenges: Badge[] }>(`${Config.ApiBaseUrl}/v2/challenge`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function get({ authToken, challengeId, ...params }: getChallenge) {
  return axios.get<{ challenge: Badge }>(`${Config.ApiBaseUrl}/v2/challenge/${challengeId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

export default {
  getList,
  get,
};
