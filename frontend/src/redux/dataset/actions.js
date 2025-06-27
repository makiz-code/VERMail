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

const options = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

export const uploadFileAsync = (Dataset) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}`, Dataset, options);
    dispatch(uploadFile(resp.data));
    dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const uploadFilesAsync = (Dataset) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}/files`, Dataset, options);
    dispatch(uploadFiles(resp.data));
    dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getFilesAsync = () => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}`);
    dispatch(getFiles(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const deleteFileAsync = (filename) => async (dispatch) => {
  try {
    const resp = await axios.delete(`${API}/${filename}`);
    dispatch(deleteFile(resp.data));
    dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const cleanDatasetAsync = (filename) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}/clean/${filename}`);
    dispatch(cleanDataset(resp.data));
    dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const labelDatasetAsync = (filename, JsonData) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}/label/${filename}`, JsonData);
    dispatch(labelDataset(resp.data));
    dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const transformDatasetAsync = (filename) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}/transform/${filename}`);
    dispatch(transformDataset(resp.data));
    dispatch(getFilesAsync());
  } catch (err) {
    console.log(err);
  }
};
