import AccountApi from 'rn-viviboom/apis/viviboom/AccountApi';

import StoreConfig from '../StoreConfig';
import { clear, set } from './index';

const fetch = async () => {
  const { id: userId, authToken } = StoreConfig.store.getState().account || {};
  if (!authToken) return null;
  const response = await AccountApi.getNotifications({ authToken, userId });
  const all = response.data.notifications || [];
  const unpresented = all.filter((notif) => notif.present && !notif.seen);
  // TODO we can skip dispatch if objects are same as stored state
  StoreConfig.dispatchStore(set({ all, unpresented }));
  return response.data;
};

/**
 * Note: do not mark notifications to be presented in bulk, else they would not show it one after another
 * @param {*} param0
 * @returns
 */
const markSeen = async ({ notificationIds }: { notificationIds?: number[] | string[] }) => {
  const { id: userId, authToken } = StoreConfig.store.getState().account;
  try {
    const response = await AccountApi.updateNotifications({
      authToken,
      userId,
      notificationIds,
      seen: true,
    });
    const { all, unpresented } = StoreConfig.store.getState().notification;
    const payload = {
      all: all.map((existing) => (notificationIds.indexOf(existing.id) >= 0 ? { ...existing, seen: true } : existing)),
      unpresented: unpresented.filter((existing) => notificationIds.indexOf(existing.id) < 0),
    };
    StoreConfig.dispatchStore(set(payload));
    return response.data;
  } catch (e) {
    console.log(e.response.data);
  }
  return null;
};

export default {
  fetch,
  markSeen,
};
