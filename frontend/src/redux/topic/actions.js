import axios from "axios";
import {
  addTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic,
} from "./reducers";

const API = "/topics";

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

export const addTopicAsync = (Topic) => async (dispatch) => {
  try {
    const resp = await apiClient.post('/', Topic);
    dispatch(addTopic(resp.data));
    await dispatch(getTopicsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getTopicsAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get('/');
    dispatch(getTopics(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getTopicAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.get(`/${id}/`);
    dispatch(getTopic(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateTopicAsync = (id, Topic) => async (dispatch) => {
  try {
    const resp = await apiClient.put(`/${id}/`, Topic);
    dispatch(updateTopic(resp.data));
    await dispatch(getTopicsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteTopicAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.delete(`/${id}/`);
    dispatch(deleteTopic(resp.data));
    await dispatch(getTopicsAsync());
  } catch (err) {
    console.log(err);
  }
};
