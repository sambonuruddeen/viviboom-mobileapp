import { createSlice } from '@reduxjs/toolkit';

const initialState = {
};

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = accountSlice.actions;
export default accountSlice.reducer;
