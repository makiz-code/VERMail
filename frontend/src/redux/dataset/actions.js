import axios from "axios";
import {
  uploadFile,
  uploadFiles,
  getFiles,
  deleteFile,
  cleanDataset,
  labelDataset,
  transformDataset,
} from "./reducers";

const API = "/dataset";

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

export const uploadFileAsync = (Dataset) => async (dispatch) => {
  try {
    const resp = await apiClient.post('/', Dataset, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(uploadFile(resp.data));
    await dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const uploadFilesAsync = (Dataset) => async (dispatch) => {
  try {
    const resp = await apiClient.post('/files/', Dataset, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(uploadFiles(resp.data));
    await dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getFilesAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get('/');
    dispatch(getFiles(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const deleteFileAsync = (filename) => async (dispatch) => {
  try {
    const resp = await apiClient.delete(`/${filename}/`);
    dispatch(deleteFile(resp.data));
    await dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const cleanDatasetAsync = (filename) => async (dispatch) => {
  try {
    const resp = await apiClient.post(`/clean/${filename}/`, null);
    dispatch(cleanDataset(resp.data));
    await dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const labelDatasetAsync = (filename, JsonData) => async (dispatch) => {
  try {
    const resp = await apiClient.post(`/label/${filename}/`, JsonData);
    dispatch(labelDataset(resp.data));
    await dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const transformDatasetAsync = (filename) => async (dispatch) => {
  try {
    const resp = await apiClient.post(`/transform/${filename}/`, null);
    dispatch(transformDataset(resp.data));
    await dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};
