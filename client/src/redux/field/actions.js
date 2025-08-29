import axios from "axios";
import {
  addField,
  getFields,
  getField,
  updateField,
  deleteField,
} from "./reducers";

const API = "/fields";

const apiClient = axios.create({
  baseURL: API,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem("token"));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const addFieldAsync = (Field) => async (dispatch) => {
  try {
    const resp = await apiClient.post('/', Field);
    dispatch(addField(resp.data));
    await dispatch(getFieldsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getFieldsAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get('/');
    dispatch(getFields(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getFieldAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.get(`/${id}/`);
    dispatch(getField(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateFieldAsync = (id, Field) => async (dispatch) => {
  try {
    const resp = await apiClient.put(`/${id}/`, Field);
    dispatch(updateField(resp.data));
    await dispatch(getFieldsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteFieldAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.delete(`/${id}/`);
    dispatch(deleteField(resp.data));
    await dispatch(getFieldsAsync());
  } catch (err) {
    console.log(err);
  }
};
