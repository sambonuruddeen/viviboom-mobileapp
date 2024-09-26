import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  videos: [],
  images: [],
  // for scrolling to new item
  newItemIndex: 0,

  isSavingMedia: false,
  // previous value for updating media
  prevVideos: [],
  prevImages: [],

  // other data
  // form data
  name: '',
  description: '',
  thumbnailUri: '',
  isCompleted: false,
  content: '',
  files: [],
  badges: [],
  projectCategories: [],
  prevBadges: [],
  prevProjectCategories: [],
};

export const createProjectSlice = createSlice({
  name: 'createProject',
  initialState,
  reducers: {
    set: (state, action) => ({ ...state, ...action.payload }),
    clear: () => ({}),
  },
});

export const { set, clear } = createProjectSlice.actions;
export default createProjectSlice.reducer;
