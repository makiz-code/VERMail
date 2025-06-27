import axios from "axios";
import {
  addMailbox,
  getMailboxes,
  getMailbox,
  updateMailbox,
  deleteMailbox,
} from "./reducers";

const API = "/mailboxes";

export const addMailboxAsync = (Mailbox) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}`, Mailbox);
    dispatch(addMailbox(resp.data));
    dispatch(getMailboxesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getMailboxesAsync = () => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}`);
    dispatch(getMailboxes(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getMailboxAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}/${id}`);
    dispatch(getMailbox(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateMailboxAsync = (id, Mailbox) => async (dispatch) => {
  try {
    const resp = await axios.put(`${API}/${id}`, Mailbox);
    dispatch(updateMailbox(resp.data));
    dispatch(getMailboxesAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteMailboxAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.delete(`${API}/${id}`);
    dispatch(deleteMailbox(resp.data));
    dispatch(getMailboxesAsync());
  } catch (err) {
    console.log(err);
  }
};
