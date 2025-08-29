import axios from "axios";
import { login, logout } from "./reducers";

const API = "/login";

export const loginAsync = (credentials) => async (dispatch) => {
  try {
    console.log("API URL:", process.env.REACT_APP_PROXY);
    const resp = await axios.post(`${API}/`, credentials);
    dispatch(login(resp.data));
  } catch (err) {
    console.log(err);
  }
};

export const logoutAsync = () => async (dispatch) => {
  try {
    dispatch(logout());
  } catch (err) {
    console.log(err);
  }
};
