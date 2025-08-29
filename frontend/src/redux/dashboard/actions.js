import axios from "axios";
import {
  parseEmails,
  getEmails,
  validateEmail,
  downloadFile,
} from "./reducers";

const API = "/dashboard";

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

export const parseEmailsAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.post('/', null);
    dispatch(parseEmails(resp.data));
    await dispatch(getEmailsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getEmailsAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get('/');
    dispatch(getEmails(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const validateEmailAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.put(`/${id}/`, null);
    dispatch(validateEmail(resp.data));
    await dispatch(getEmailsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const downloadFileAsync = (params) => async (dispatch) => {
  try {
    const resp = await apiClient.post('/download/', params, {
      responseType: "blob",
    });
    dispatch(downloadFile(resp.data));

    const blob = new Blob([resp.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = params.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.log(err);
  }
};
