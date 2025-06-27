import axios from "axios";
import {
  addAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
} from "./reducers";

const API = "/accounts";

export const addAccountAsync = (Account) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}`, Account);
    dispatch(addAccount(resp.data));
    dispatch(getAccountsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getAccountsAsync = () => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}`);
    dispatch(getAccounts(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getAccountAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}/${id}`);
    dispatch(getAccount(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateAccountAsync = (id, Account) => async (dispatch) => {
  try {
    const resp = await axios.put(`${API}/${id}`, Account);
    dispatch(updateAccount(resp.data));
    dispatch(getAccountsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteAccountAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.delete(`${API}/${id}`);
    dispatch(deleteAccount(resp.data));
    dispatch(getAccountsAsync());
  } catch (err) {
    console.log(err);
  }
};
