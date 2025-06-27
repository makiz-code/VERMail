import axios from "axios";
import {
  addTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic,
} from "./reducers";

const API = "/topics";

export const addTopicAsync = (Topic) => async (dispatch) => {
  try {
    const resp = await axios.post(`${API}`, Topic);
    dispatch(addTopic(resp.data));
    dispatch(getTopicsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const getTopicsAsync = () => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}`);
    dispatch(getTopics(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const getTopicAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.get(`${API}/${id}`);
    dispatch(getTopic(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const updateTopicAsync = (id, Topic) => async (dispatch) => {
  try {
    const resp = await axios.put(`${API}/${id}`, Topic);
    dispatch(updateTopic(resp.data));
    dispatch(getTopicsAsync());
  } catch (err) {
    console.log(err);
  }
};

export const deleteTopicAsync = (id) => async (dispatch) => {
  try {
    const resp = await axios.delete(`${API}/${id}`);
    dispatch(deleteTopic(resp.data));
    dispatch(getTopicsAsync());
  } catch (err) {
    console.log(err);
  }
};
