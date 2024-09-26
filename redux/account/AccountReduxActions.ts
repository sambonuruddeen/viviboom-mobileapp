import OneSignal from 'react-native-onesignal';

import AccountApi from 'rn-viviboom/apis/viviboom/AccountApi';
import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import Config from 'rn-viviboom/constants/Config';

import StoreConfig from '../StoreConfig';
import { clear, set } from './index';

const addUserToOneSignal = ({
  id,
  guardianEmail,
  guardianPhone,
  branch,
  institution,
}: {
  id: number;
  guardianEmail: string;
  guardianPhone: string;
  branch: Branch;
  institution?: Institution;
}) => {
  if (id) OneSignal.setExternalUserId(`${id}`);
  if (guardianEmail) OneSignal.setEmail(guardianEmail);
  if (guardianPhone) OneSignal.setSMSNumber(`${guardianPhone}`);
  if (branch) {
    const { name, countryISO } = branch;
    OneSignal.sendTags({
      institution: institution?.name,
      branch: name,
      country: countryISO,
    });
  }
};

interface ILogin {
  username: string;
  password: string;
}

const login = async ({ username, password }: ILogin) => {
  const response = await AccountApi.login({ username, password });
  StoreConfig.dispatchStore(set(response.data));
  const { id, guardianEmail, guardianPhone, branch, institution } = response?.data || {};
  if (Config.EnableOneSignal) addUserToOneSignal({ id, guardianEmail, guardianPhone, branch, institution });
  return response.data;
};

interface ISignUp {
  givenName: string;
  familyName: string;
  email: string;
  username: string;
  password: string;
  branchCode: string;
}

const signUp = async ({ givenName, familyName, email, username, password, branchCode }: ISignUp) => {
  const response = await AccountApi.postPublicSignUp({
    givenName,
    familyName,
    guardianEmail: email,
    username,
    newPassword: password,
    branchCode,
  });
  StoreConfig.dispatchStore(set(response.data));
  const { id, guardianEmail, guardianPhone, branch, institution } = response?.data || {};
  if (Config.EnableOneSignal) addUserToOneSignal({ id, guardianEmail, guardianPhone, branch, institution });
  return response.data;
};

const logout = async () => {
  const { account } = StoreConfig.store.getState();
  let response;
  if (account?.authToken) {
    try {
      response = await AccountApi.logout({ authToken: account?.authToken });
    } catch (e) {
      console.error(e);
    }
  }
  if (Config.EnableOneSignal) OneSignal.removeExternalUserId();
  StoreConfig.dispatchStore(clear());
  return response?.data;
};

const fetch = async () => {
  const { account } = StoreConfig.store.getState();
  const { id, authToken } = account;
  let response;
  try {
    response = await UserApi.get({ authToken, userId: id });
  } catch (e) {
    console.error(e);
    throw e;
  }
  if (!response?.data) {
    return null;
  }
  StoreConfig.dispatchStore(set({ ...account, ...response.data.user }));
  return response?.data;
};

export default {
  login,
  signUp,
  logout,
  fetch,
};
