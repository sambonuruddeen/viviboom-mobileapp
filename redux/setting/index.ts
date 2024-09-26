import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // colorScheme: 'light' | 'dark'
};

export const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = settingSlice.actions;
export default settingSlice.reducer;
