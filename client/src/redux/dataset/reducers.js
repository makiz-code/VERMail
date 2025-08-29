import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  files: [],
  emails: [],
  topics: [],
  notif: {},
  stats: [],
};

const datasetSlice = createSlice({
  name: "dataset",
  initialState,
  reducers: {
    uploadFile(state, action) {
      state.notif = action.payload.notif;
    },
    uploadFiles(state, action) {
      state.notif = action.payload.notif;
    },
    getFiles(state, action) {
      state.files = action.payload.data;
      state.notif = action.payload.notif;
    },
    deleteFile(state, action) {
      state.notif = action.payload.notif;
    },
    cleanDataset(state, action) {
      state.emails = action.payload.data.emails;
      state.topics = action.payload.data.topics;
      state.notif = action.payload.notif;
    },
    labelDataset(state, action) {
      state.notif = action.payload.notif;
    },
    transformDataset(state, action) {
      state.stats = action.payload.data;
      state.notif = action.payload.notif;
    },
  },
});

export const {
  uploadFile,
  uploadFiles,
  getFiles,
  deleteFile,
  cleanDataset,
  labelDataset,
  transformDataset,
} = datasetSlice.actions;

export default datasetSlice.reducer;
