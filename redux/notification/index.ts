import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  all: [],
  unpresented: [],
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set } = notificationSlice.actions;
export default notificationSlice.reducer;
