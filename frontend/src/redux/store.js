import { configureStore } from "@reduxjs/toolkit";
import logger from "redux-logger";
import mailboxReducer from "./mailbox/reducers";
import senderReducer from "./sender/reducers";
import topicReducer from "./topic/reducers";
import fieldReducer from "./field/reducers";
import datasetReducer from "./dataset/reducers";
import modelReducer from "./model/reducers";
import dashboardReducer from "./dashboard/reducers";
import accountReducer from "./account/reducers";
import loginReducer from "./login/reducers";

const middleware = (getDefaultMiddleware) => {
  let middlewares = getDefaultMiddleware();
  if (process.env.NODE_ENV !== "production") {
    middlewares = [...middlewares, logger];
  }
  return middlewares;
};

const store = configureStore({
  reducer: {
    mailbox: mailboxReducer,
    sender: senderReducer,
    topic: topicReducer,
    field: fieldReducer,
    dataset: datasetReducer,
    model: modelReducer,
    dashboard: dashboardReducer,
    account: accountReducer,
    login: loginReducer,
  },
  middleware,
});

export default store;
