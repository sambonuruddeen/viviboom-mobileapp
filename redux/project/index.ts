import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  homeProjects: [],
  draftProjects: [],
  blockedProjectIds: [],
  searchHistory: [],
};

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = projectSlice.actions;
export default projectSlice.reducer;
