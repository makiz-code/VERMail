import axios from "axios";
import {
  addSender,
  getSenders,
  getSender,
  updateSender,
  deleteSender,
} from "./reducers";

const API = "/senders";

export const addSenderAsync = (Sender) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}`, Sender);
    dispatch(addSender(resp.data));
    dispatch(getSendersAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getSendersAsync = () => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}`);
    dispatch(getSenders(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getSenderAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}/${id}`);
    dispatch(getSender(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateSenderAsync = (id, Sender) => async (dispatch) => {
  try {
    const resp = await axios.put(`${API}/${id}`, Sender);
    dispatch(updateSender(resp.data));
    dispatch(getSendersAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteSenderAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.delete(`${API}/${id}`);
    dispatch(deleteSender(resp.data));
    dispatch(getSendersAsync());
  } catch (err) {
    console.log(err);
  }
};
