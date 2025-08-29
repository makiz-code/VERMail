import axios from "axios";
import {
  addMailbox,
  getMailboxes,
  getMailbox,
  updateMailbox,
  deleteMailbox,
} from "./reducers";

const API = "/mailboxes";

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

export const addMailboxAsync = (Mailbox) => async (dispatch) => {
  try {
    const resp = await apiClient.post('/', Mailbox);
    dispatch(addMailbox(resp.data));
    await dispatch(getMailboxesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getMailboxesAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get('/');
    dispatch(getMailboxes(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getMailboxAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.get(`/${id}/`);
    dispatch(getMailbox(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateMailboxAsync = (id, Mailbox) => async (dispatch) => {
  try {
    const resp = await apiClient.put(`/${id}/`, Mailbox);
    dispatch(updateMailbox(resp.data));
    await dispatch(getMailboxesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteMailboxAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.delete(`/${id}/`);
    dispatch(deleteMailbox(resp.data));
    await dispatch(getMailboxesAsync());
  } catch (err) {
    console.log(err);
  }
};
