import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  wallet: null,
  recentTransactions: [],
  recentInteractedUsers: [],
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = walletSlice.actions;
export default walletSlice.reducer;
