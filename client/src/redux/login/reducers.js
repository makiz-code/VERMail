import { createSlice } from "@reduxjs/toolkit";

const savedToken = JSON.parse(localStorage.getItem("token")) || {};

const initialState = {
  token: savedToken,
  notif: {},
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    login(state, action) {
      state.notif = action.payload.notif || {};
      state.token = action.payload.data?.token || {};
      if (state.token && Object.keys(state.token).length) {
        localStorage.setItem("token", JSON.stringify(state.token));
      } else {
        localStorage.removeItem("token");
      }
    },
    logout(state) {
      state.token = {};
      state.notif = {};
      localStorage.removeItem("token");
    },
  },
});

export const { login, logout } = loginSlice.actions;

export default loginSlice.reducer;
