import axios from "axios";
import {
  addField,
  getFields,
  getField,
  updateField,
  deleteField,
} from "./reducers";

const API = "/fields";

export const addFieldAsync = (Field) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}`, Field);
    dispatch(addField(resp.data));
    dispatch(getFieldsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getFieldsAsync = () => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}`);
    dispatch(getFields(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getFieldAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}/${id}`);
    dispatch(getField(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateFieldAsync = (id, Field) => async (dispatch) => {
  try {
    const resp = await axios.put(`${API}/${id}`, Field);
    dispatch(updateField(resp.data));
    dispatch(getFieldsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteFieldAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.delete(`${API}/${id}`);
    dispatch(deleteField(resp.data));
    dispatch(getFieldsAsync());
  } catch (err) {
    console.log(err);
  }
};
