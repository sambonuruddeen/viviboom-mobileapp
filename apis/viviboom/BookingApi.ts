import axios from 'axios';

import Config from '../../constants/Config';

async function get({ authToken, bookingId, ...params }) {
  return axios.get<{ booking: UserEventBooking }>(`${Config.ApiBaseUrl}/v2/booking/${bookingId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function getList({ authToken, ...params }) {
  return axios.get<{ bookings: UserEventBooking[]; count: number }>(`${Config.ApiBaseUrl}/v2/booking`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function post({ authToken, userId, eventId, ...rest }) {
  return axios.post<{ booking: UserEventBooking }>(
    `${Config.ApiBaseUrl}/v2/booking`,
    {
      userId,
      eventId,
      ...rest,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

/**
 * @param { authToken, bookingId, status, ...rest } param0 use status = BookingStatusType.CANCEL to cancel a booking
 * @returns promise of request
 */
async function patch({ authToken, bookingId, ...rest }) {
  return axios.patch<{ booking: UserEventBooking }>(
    `${Config.ApiBaseUrl}/v2/booking/${bookingId}`,
    {
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
  post,
  patch,
};
