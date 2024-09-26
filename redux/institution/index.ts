import { createSlice } from '@reduxjs/toolkit';

const initialState = {
};

export const institutionSlice = createSlice({
  name: 'institution',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = institutionSlice.actions;
export default institutionSlice.reducer;
