import axios from 'axios';

import Config from '../../constants/Config';

async function signUp(data: object) {
  return axios.post<{ message: string }>(`${Config.ApiBaseUrl}/v2/user/auth/signup`, data);
}

async function login({ username, password }) {
  return axios.post<User>(`${Config.ApiBaseUrl}/v2/user/auth/login`, {
    username,
    password,
  });
}

async function logout({ authToken }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/user/auth/logout`,
    {},
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function postPublicSignUp(body) {
  return axios.post<User>(`${Config.ApiBaseUrl}/v2/user/public/sign-up`, body);
}

async function requestVerifyEmail({ authToken }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/user/email/request-verify`,
    {},
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function requestVerifyEmailToken({ authToken }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/user/email/request-verify`,
    {},
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function verifyEmail({ authToken, token }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/user/email/verify`,
    {
      token,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function requestResetPasswordToken({ email }) {
  return axios.post(`${Config.ApiBaseUrl}/v2/user/password/request-reset`, {
    email,
  });
}

async function resetPassword({ authToken, token, password }) {
  return axios.post(
    `${Config.ApiBaseUrl}/v2/user/password/reset`,
    {
      token,
      password,
    },
    {
      headers: { 'auth-token': authToken },
    },
  );
}

async function deleteUser({ authToken, userId, password }: { authToken: string; userId: string; password: string }) {
  return axios.delete<{ message: string }>(`${Config.ApiBaseUrl}/v2/user/${userId}`, {
    headers: { 'auth-token': authToken },
    data: { password },
  });
}

async function getNotifications({ authToken, userId }: { authToken: string; userId: string }) {
  return axios.get<{ notifications: object[] }>(`${Config.ApiBaseUrl}/v2/user/${userId}/notification`, {
    headers: { 'auth-token': authToken },
  });
}

async function updateNotifications({
  authToken,
  userId,
  notificationIds,
  seen,
  present,
}: {
  authToken: string;
  userId: number | string;
  notificationIds: number[] | string[];
  seen?: boolean;
  present?: boolean;
}) {
  return axios.patch<{ notifications: object[] }>(
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

export default {
  signUp,
  login,
  logout,
  postPublicSignUp,
  requestVerifyEmail,
  requestVerifyEmailToken,
  verifyEmail,
  requestResetPasswordToken,
  resetPassword,
  deleteUser,
  getNotifications,
  updateNotifications,
};
