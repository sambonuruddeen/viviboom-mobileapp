import axios from 'axios';
import { UUID } from 'react-native-ble-plx';

import Config from '../../constants/Config';

interface getWalletParams {
  authToken: string;
  walletId: number;
}
interface claimRewardParams {
  authToken: string;
  code: string;
}

interface getTransactionParams {
  authToken: string;
  transactionId: number;
}

interface getTransactionListParams {
  authToken: string;
}

interface postTransactionParams {
  authToken: string;
  receiverWalletId: number;
  amount: number;
  description: string;
  clientRequestUuid: UUID;
}

interface postWalletParams {
  authToken: string;
  userId: number;
}

async function getWallet({ authToken, walletId, ...params }: getWalletParams) {
  return axios.get<{ wallet: Wallet }>(`${Config.ApiBaseUrl}/v2/wallet/${walletId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function claimReward({ authToken, code }: claimRewardParams) {
  return axios.post<{ transactionId: number }>(`${Config.ApiBaseUrl}/v2/reward/claim`, { code }, { headers: { 'auth-token': authToken } });
}

async function getTransaction({ authToken, transactionId, ...params }: getTransactionParams) {
  return axios.get<{ transaction: Transaction }>(`${Config.ApiBaseUrl}/v2/transaction/${transactionId}`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function getTransactionList({ authToken, ...params }: getTransactionListParams) {
  return axios.get<{ transactions: Array<Transaction>; count: number }>(`${Config.ApiBaseUrl}/v2/transaction`, {
    headers: { 'auth-token': authToken },
    params,
  });
}

async function postTransaction({ authToken, receiverWalletId, amount, description, clientRequestUuid }: postTransactionParams) {
  return axios.post<{ transactionId: number }>(
    `${Config.ApiBaseUrl}/v2/transaction`,
    {
      receiverWalletId,
      amount,
      description,
      clientRequestUuid,
    },
    { headers: { 'auth-token': authToken } },
  );
}

async function postWallet({ authToken, userId }: postWalletParams) {
  return axios.post<{ walletId: number }>(`${Config.ApiBaseUrl}/v2/wallet`, { userId }, { headers: { 'auth-token': authToken } });
}

export default {
  getWallet,
  claimReward,
  getTransactionList,
  postWallet,
  postTransaction,
  getTransaction,
};
