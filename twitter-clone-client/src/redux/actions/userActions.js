import {
  SET_USER,
  SET_ERRORS,
  CLEAR_ERRORS,
  LOADING_UI,
  SET_UNAUTHENTICATED,
} from "../types";
import axios from "axios";
export const loginUser = (userData, history) => (dispatch) => {
  dispatch({
    type: LOADING_UI,
  });
  axios
    .post("/login", userData)
    .then((res) => {
      const FBIdToken = "Bearer " + res.data.token;
      localStorage.setItem("FBIdToken", FBIdToken);
      axios.defaults.headers.common["authorization"] = FBIdToken;
      dispatch(getUserData());
      dispatch({
        type: CLEAR_ERRORS,
      });
      history.push("/");
    })
    .catch((err) => {
      dispatch({
        type: SET_ERRORS,
        payload: err.response.data,
      });
    });
};

export const signupUser = (newUserData, history) => (dispatch) => {
  dispatch({
    type: LOADING_UI,
  });
  axios
    .post("/signup", newUserData)
    .then((res) => {
      const FBIdToken = "Bearer " + res.data.token;
      localStorage.setItem("FBIdToken", FBIdToken);
      axios.defaults.headers.common["authorization"] = FBIdToken;
      dispatch(getUserData());
      dispatch({
        type: CLEAR_ERRORS,
      });
      history.push("/");
    })
    .catch((err) => {
      dispatch({
        type: SET_ERRORS,
        payload: err.response.data,
      });
    });
};

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem("FBIdToken");
  delete axios.defaults.headers.common["autherization"];
  dispatch({ type: SET_UNAUTHENTICATED });
};

export const getUserData = () => (dispatch) => {
  axios
    .get("/user/profile")
    .then((res) => {
      dispatch({
        type: SET_USER,
        payload: res.data,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
