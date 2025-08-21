import axios from "axios";
import {
  getDataset,
  trainModel,
  resetModel,
  getMetrics,
  dropDataset,
} from "./reducers";

const API = "/model";

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

export const getDatasetAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get("/dataset");
    dispatch(getDataset(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const dropDatasetAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.delete("/dataset");
    dispatch(dropDataset(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const trainModelAsync = (Params) => async (dispatch) => {
  try {
    const resp = await apiClient.post("/", Params);
    dispatch(trainModel(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getMetricsAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get("/");
    dispatch(getMetrics(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const resetModelAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.delete("/");
    dispatch(resetModel(resp.data));
  } catch (err) {
    console.log(err);
  }
};
