import axios from 'axios';
import FormData from 'form-data';

import Config from '../../constants/Config';

async function get({ authToken, userId, ...params }) {
  return axios.get<{ user: User }>(`${Config.ApiBaseUrl}/v2/user/${userId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function getList({ authToken, ...params }) {
  return axios.get<{ users: User[]; count: number }>(`${Config.ApiBaseUrl}/v2/user`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function patch({ authToken, userId, ...fields }) {
  return axios.patch(`${Config.ApiBaseUrl}/v2/user/${userId}`, fields, {
    headers: { 'auth-token': authToken },
  });
}

async function deleteUser({ authToken, userId, password }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/user/${userId}/delete`,
    { password },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function requestVerifyEmail({ authToken, email }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/user/email/request-verify`,
    { email },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function verifyEmail({ token }) {
  return axios.post(`${Config.ApiBaseUrl}/v2/user/email/verify`, { token });
}

async function passwordResetToken({ email }) {
  return axios.post(`${Config.ApiBaseUrl}/v2/user/password/request-reset`, { email });
}

async function passwordReset({ token, password }) {
  return axios.post(`${Config.ApiBaseUrl}/v2/user/password/reset`, { token, password });
}

async function putImage({ authToken, userId, imageType, file }) {
  const formData = new FormData();
  formData.append('file', file);
  return axios.put(`${Config.ApiBaseUrl}/v2/user/${userId}/${imageType}`, formData, {
    headers: { 'auth-token': authToken, 'Content-Type': 'multipart/form-data' },
  });
}

async function getNotifications({ authToken, userId }) {
  return axios.get(`${Config.ApiBaseUrl}/v2/user/${userId}/notification`, {
    headers: { 'auth-token': authToken },
  });
}

async function updateNotifications({ authToken, userId, notificationIds, seen, present }) {
  return axios.patch(
    `${Config.ApiBaseUrl}/v2/user/${userId}/notification`,
    {
      seen,
      present,
      notificationIds,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function getUserBookingQuota({ authToken, userId, ...params }) {
  return axios.get(`${Config.ApiBaseUrl}/v2/user/${userId}/booking-quota`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function postBadge({ authToken, userId, badgeId, ...fields }) {
  return axios.post(`${Config.ApiBaseUrl}/v2/user/${userId}/badge/${badgeId}`, fields, {
    headers: { 'auth-token': authToken },
  });
}

export default {
  get,
  getList,
  patch,
  deleteUser,
  requestVerifyEmail,
  verifyEmail,
  passwordResetToken,
  passwordReset,
  getNotifications,
  putImage,
  updateNotifications,
  getUserBookingQuota,
  postBadge,
};
