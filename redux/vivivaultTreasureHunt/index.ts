import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  firepit: false,
  spaceSearch: false,
  puzzle: false,
  worldTravel: false,
  finalQuest: false,
};

export const vivivaultTreasureHuntSlice = createSlice({
  name: 'vivivaultTreasureHunt',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = vivivaultTreasureHuntSlice.actions;
export default vivivaultTreasureHuntSlice.reducer;
