import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mailboxes: [],
  mailbox: {},
  notif: {},
  error: {},
};

const mailboxSlice = createSlice({
  name: "mailbox",
  initialState,
  reducers: {
    addMailbox(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    getMailboxes(state, action) {
      state.mailboxes = action.payload.data;
    },
    getMailbox(state, action) {
      state.mailbox = action.payload.data;
      state.notif = action.payload.notif;
    },
    updateMailbox(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    deleteMailbox(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
  },
});

export const {
  addMailbox,
  getMailboxes,
  getMailbox,
  updateMailbox,
  deleteMailbox,
} = mailboxSlice.actions;

export default mailboxSlice.reducer;
