import axios from 'axios';

import Config from '../../constants/Config';

async function get({ authToken, eventId, ...params }) {
  return axios.get<MyEvent>(`${Config.ApiBaseUrl}/v2/event/${eventId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function getList({ authToken, ...params }) {
  return axios.get<{ events: MyEvent[]; count: number }>(`${Config.ApiBaseUrl}/v2/event`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function postResponse({ authToken, eventId, bookingId, responses, ...rest }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/event/${eventId}/response`,
    {
      bookingId,
      responses,
      ...rest,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

export default {
  get,
  getList,
  postResponse,
};
