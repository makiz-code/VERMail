import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fields: [],
  field: {},
  notif: {},
  error: {},
};

const fieldSlice = createSlice({
  name: "field",
  initialState,
  reducers: {
    addField(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    getFields(state, action) {
      state.fields = action.payload.data;
    },
    getField(state, action) {
      state.field = action.payload.data;
      state.notif = action.payload.notif;
    },
    updateField(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
    deleteField(state, action) {
      state.notif = action.payload.notif;
      state.error = action.payload.error;
    },
  },
});

export const {
  addField,
  getFields,
  getField,
  updateField,
  deleteField,
} = fieldSlice.actions;

export default fieldSlice.reducer;
