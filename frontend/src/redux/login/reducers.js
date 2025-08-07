import { createSlice } from "@reduxjs/toolkit";

const savedAccess = JSON.parse(localStorage.getItem("access")) || {};

const initialState = {
  access: savedAccess,
  notif: {},
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    login(state, action) {
      state.access = action.payload.data;
      state.notif = action.payload.notif;
      localStorage.setItem("access", JSON.stringify(action.payload.data));
    },
    logout(state) {
      state.access = {};
      state.notif = {};
      localStorage.removeItem("access");
    },
  },
});

export const { login, logout } = loginSlice.actions;

export default loginSlice.reducer;
