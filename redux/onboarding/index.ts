import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  landing: false,
  createProject: false,
  badge: false,
  event: false,
  profile: false,
  completeProject: false,
  projectBadge: false,
  chatWithCreator: false,
};

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = onboardingSlice.actions;
export default onboardingSlice.reducer;
