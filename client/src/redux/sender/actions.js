import axios from "axios";
import {
  addSender,
  getSenders,
  getSender,
  updateSender,
  deleteSender,
} from "./reducers";

const API = "/senders";

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

export const addSenderAsync = (Sender) => async (dispatch) => {
  try {
    const resp = await apiClient.post('/', Sender);
    dispatch(addSender(resp.data));
    await dispatch(getSendersAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getSendersAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get('/');
    dispatch(getSenders(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getSenderAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.get(`/${id}/`);
    dispatch(getSender(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateSenderAsync = (id, Sender) => async (dispatch) => {
  try {
    const resp = await apiClient.put(`/${id}/`, Sender);
    dispatch(updateSender(resp.data));
    await dispatch(getSendersAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteSenderAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.delete(`/${id}/`);
    dispatch(deleteSender(resp.data));
    await dispatch(getSendersAsync());
  } catch (err) {
    console.log(err);
  }
};
