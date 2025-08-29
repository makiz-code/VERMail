import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  topics: [],
  topic: {},
  notif: {},
  error: {},
};

const topicSlice = createSlice({
  name: "topic",
  initialState,
  reducers: {
    addTopic(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    getTopics(state, action) {
      state.topics = action.payload.data;
    },
    getTopic(state, action) {
      state.topic = action.payload.data;
      state.notif = action.payload.notif;
    },
    updateTopic(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    deleteTopic(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
  },
});

export const {
  addTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic,
} = topicSlice.actions;

export default topicSlice.reducer;
