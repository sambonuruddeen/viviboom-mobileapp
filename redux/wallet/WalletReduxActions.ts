import UserApi from 'rn-viviboom/apis/viviboom/UserApi';
import VivicoinApi from 'rn-viviboom/apis/viviboom/VivicoinApi';

import StoreConfig from '../StoreConfig';
import { set } from './index';

interface ISave {
  wallet?: Wallet;
  recentTransactions?: Transaction[];
  recentInteractedUsers?: User[];
}

const save = (data: ISave) => {
  const userId = StoreConfig.store.getState().account?.id;
  const userWalletData = StoreConfig.store.getState().wallet?.[userId] || {};

  StoreConfig.dispatchStore(set({ [userId]: { ...userWalletData, ...data } }));
};

const fetch = async () => {
  const user = StoreConfig.store.getState().account;
  const walletId = StoreConfig.store.getState().wallet?.[user?.id]?.wallet?.id;

  if (!user?.branch?.allowVivicoinRewards || !user?.institution?.isRewardEnabled) return;

  if (walletId) {
    try {
      const res = await VivicoinApi.getWallet({ authToken: user?.authToken, walletId });
      save({ wallet: res.data.wallet });
    } catch (e) {
      console.log(e);
    }
  } else {
    try {
      const res = await UserApi.get({ authToken: user?.authToken, userId: user?.id, verboseAttributes: ['wallet'] });
      let fetchedWallet = res?.data?.user?.wallet;
      if (!fetchedWallet) {
        const postWalletRes = await VivicoinApi.postWallet({
          authToken: user?.authToken,
          userId: user?.id,
        });
        const getWalletRes = await VivicoinApi.getWallet({ authToken: user?.authToken, walletId: postWalletRes.data.walletId });
        fetchedWallet = getWalletRes.data.wallet;
      }
      save({ wallet: fetchedWallet });
    } catch (e) {
      console.log(e);
    }
  }
};

export default {
  save,
  fetch,
};
