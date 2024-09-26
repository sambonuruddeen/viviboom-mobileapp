import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  starterBadges: [],
  categoryToBadges: {},
  badgeCategories: [],
};

export const badgeSlice = createSlice({
  name: 'badge',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = badgeSlice.actions;
export default badgeSlice.reducer;
