import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  senders: [],
  sender: {},
  notif: {},
  error: {},
};

const senderSlice = createSlice({
  name: "sender",
  initialState,
  reducers: {
    addSender(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    getSenders(state, action) {
      state.senders = action.payload.data;
    },
    getSender(state, action) {
      state.sender = action.payload.data;
      state.notif = action.payload.notif;
    },
    updateSender(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    deleteSender(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
  },
});

export const {
  addSender,
  getSenders,
  getSender,
  updateSender,
  deleteSender,
} = senderSlice.actions;

export default senderSlice.reducer;
