import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accounts: [],
  account: {},
  notif: {},
  error: {},
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    addAccount(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    getAccounts(state, action) {
      state.accounts = action.payload.data;
    },
    getAccount(state, action) {
      state.account = action.payload.data;
      state.notif = action.payload.notif;
    },
    updateAccount(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    deleteAccount(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
  },
});

export const {
  addAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
} = accountSlice.actions;

export default accountSlice.reducer;
