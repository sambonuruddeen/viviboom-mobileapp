import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  homeEvents: [],
  myBookings: [],
};

export const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = eventSlice.actions;
export default eventSlice.reducer;
