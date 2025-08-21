import axios from "axios";
import {
  addAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
} from "./reducers";

const API = "/accounts";

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

export const addAccountAsync = (Account) => async (dispatch) => {
  try {
    const resp = await apiClient.post("/", Account);
    dispatch(addAccount(resp.data));
    await dispatch(getAccountsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getAccountsAsync = () => async (dispatch) => {
  try {
    const resp = await apiClient.get("/");
    dispatch(getAccounts(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getAccountAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.get(`/${id}`);
    dispatch(getAccount(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateAccountAsync = (id, Account) => async (dispatch) => {
  try {
    const resp = await apiClient.put(`/${id}`, Account);
    dispatch(updateAccount(resp.data));
    await dispatch(getAccountsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteAccountAsync = (id) => async (dispatch) => {
  try {
    const resp = await apiClient.delete(`/${id}`);
    dispatch(deleteAccount(resp.data));
    await dispatch(getAccountsAsync());
  } catch (err) {
    console.log(err);
  }
};
