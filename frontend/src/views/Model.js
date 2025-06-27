import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasetAsync,
  trainModelAsync,
  resetModelAsync,
  getMetricsAsync,
  dropDatasetAsync,
} from "../redux/model/actions";
import NotificationAlert from "react-notification-alert";
import ChartistGraph from "react-chartist";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import { FaUndo, FaPlayCircle } from "react-icons/fa";
import { horizontalBarEventHandlers } from "../utils/EventHandlers";
import { horizontalBarOptions } from "../utils/ChartOptions";
import { getData } from "../utils/ChartData";

const numEpochsValues = {
  min: 2,
  default: 3,
  max: 5,
};

const batchSizeValues = {
  min: 32,
  default: 64,
  max: 128,
};

const maxLenValues = {
  min: 64,
  default: 128,
  max: 256,
};

const learningRateValues = {
  min: 2e-5,
  default: 5e-5,
  max: 5e-4,
};

const initialState = {
  numEpochs: numEpochsValues.default,
  batchSize: batchSizeValues.default,
  maxLen: maxLenValues.default,
  learningRate: learningRateValues.default,
};

const Model = () => {
  const history = useHistory();

  const [data, setData] = useState(null);
  const [state, setState] = useState(initialState);
  const [spinner, setSpinner] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const notificationAlertRef = useRef(null);
  const notify = (notif, place) => {
    var options = {
      message: <div dangerouslySetInnerHTML={{ __html: notif.msg }}></div>,
      type: notif.type,
      place: place,
      icon: "nc-icon nc-bell-55",
      autoDismiss: 5,
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  const { metadata, metrics, notif } = useSelector((state) => state.model);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getDatasetAsync());
    if (notif?.type != "warning") {
      dispatch(getMetricsAsync());
    }
    setSpinner(`Dataset stats and Model metrics are being fetched...`);
  }, [dispatch]);

  useEffect(() => {
    if (notif?.msg && notif?.type != "warning") {
      dispatch(getMetricsAsync());
    }
  }, [notif]);

  useEffect(() => {
    if (notif?.msg) {
      if (
        !notif?.msg?.includes("dataset is empty") &&
        !notif?.msg?.includes("Dataset has been deleted successfully")
      ) {
        notify(notif, "tr");
      }
      setProcessing(false);
      setSpinner(null);
    }
  }, [notif]);

  useEffect(() => {
    if (
      notif?.msg?.includes("dataset is empty") ||
      notif?.msg?.includes("Dataset has been deleted successfully")
    ) {
      history.push("./dataset");
    }
  }, [notif, history]);

  useEffect(() => {
    if (metadata?.stats?.dataset) {
      setData(getData(metadata.stats.topics));
      setSpinner(null);
    }
  }, [metadata]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = parseFloat(value);
    setState((prevState) => ({ ...prevState, [name]: parsedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(trainModelAsync(state));
    setSpinner(`Model is being trained on <b>${metadata.device}</b>...`);
    setProcessing(true);
  };

  const handleReset = () => {
    dispatch(resetModelAsync());
  };

  const handleDrop = () => {
    dispatch(dropDatasetAsync());
  };

  return (
    <div className="container-fluid">
      {metadata?.stats?.dataset && (
        <div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dataset Statistics</h4>
              <p className="card-category">
                database: {metadata.stats.dataset}
              </p>
            </div>
            <div className="card-body">
              <div className="ct-chart">
                <ChartistGraph
                  type="Bar"
                  data={data}
                  options={horizontalBarOptions}
                  listener={horizontalBarEventHandlers}
                />
              </div>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center mr-1">
              <div className="stats">
                <i className="far fa-chart-bar"></i> rows count :{" "}
                <b>{metadata.stats.rows}</b>
              </div>
              <button
                className="btn btn-danger p-0 border-0"
                onClick={() =>
                  setShowModal({
                    text: `Do you want to delete the global dataset ?`,
                    confirm: "Yes",
                    cancel: "No",
                    action: () => handleDrop(),
                  })
                }
              >
                <i className="fas fa-database"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {metadata?.stats?.dataset && (
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Manage Model</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-lg-4 d-flex justify-content-around align-items-center">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            htmlFor="numEpochsInput"
                            className="form-label"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            Num Epochs
                          </label>
                          <select
                            id="numEpochsInput"
                            name="numEpochs"
                            className={"form-control"}
                            value={state.numEpochs}
                            onChange={handleChange}
                          >
                            <option value={numEpochsValues.min}>
                              {numEpochsValues.min}
                            </option>
                            <option value={numEpochsValues.default}>
                              {numEpochsValues.default}
                            </option>
                            <option value={numEpochsValues.max}>
                              {numEpochsValues.max}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            htmlFor="batchSizeInput"
                            className="form-label"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            Batch Size
                          </label>
                          <select
                            id="batchSizeInput"
                            name="batchSize"
                            className={"form-control"}
                            value={state.batchSize}
                            onChange={handleChange}
                          >
                            <option value={batchSizeValues.min}>
                              {batchSizeValues.min}
                            </option>
                            <option value={batchSizeValues.default}>
                              {batchSizeValues.default}
                            </option>
                            <option value={batchSizeValues.max}>
                              {batchSizeValues.max}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 d-flex justify-content-around align-items-center">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            htmlFor="maxLenInput"
                            className="form-label"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            Max Len
                          </label>
                          <select
                            id="maxLenInput"
                            name="maxLen"
                            className={"form-control"}
                            value={state.maxLen}
                            onChange={handleChange}
                          >
                            <option value={maxLenValues.min}>
                              {maxLenValues.min}
                            </option>
                            <option value={maxLenValues.default}>
                              {maxLenValues.default}
                            </option>
                            <option value={maxLenValues.max}>
                              {maxLenValues.max}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label
                            htmlFor="learningRateInput"
                            className="form-label"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            Learning Rate
                          </label>
                          <select
                            id="learningRateInput"
                            name="learningRate"
                            className={"form-control"}
                            value={state.learningRate}
                            onChange={handleChange}
                          >
                            <option value={learningRateValues.min}>
                              {learningRateValues.min}
                            </option>
                            <option value={learningRateValues.default}>
                              {learningRateValues.default}
                            </option>
                            <option value={learningRateValues.max}>
                              {learningRateValues.max}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 d-flex justify-content-around mt-2">
                      <div className="col-md-6 d-flex align-items-center">
                        <button
                          className={`btn btn-secondary ${
                            processing && "text-secondary"
                          } w-100`}
                          type="button"
                          style={{ whiteSpace: "nowrap" }}
                          disabled={processing}
                          onClick={() =>
                            setShowModal({
                              text: `Do you want to reset the model ?`,
                              confirm: "Yes",
                              cancel: "No",
                              action: () => handleReset(),
                            })
                          }
                        >
                          <FaUndo className="mr-2" />
                          Reset
                        </button>
                      </div>
                      <div className="col-md-6 d-flex align-items-center">
                        <button
                          className={`btn btn-primary btn-fill w-100`}
                          type="submit"
                          style={{ whiteSpace: "nowrap" }}
                          disabled={processing}
                        >
                          <FaPlayCircle className="mr-2" />
                          Train
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="clearfix"></div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {metadata?.stats?.dataset && metrics?.accuracy && !spinner && (
        <div className="row">
          <div className="col-sm-6 row p-0 m-0">
            <div className="col-xl-6">
              <div className="card card-stats">
                <div className="card-body">
                  <div className="row">
                    <div className="col-5">
                      <div className="icon-big text-center icon-warning">
                        <i className="fas fa-check-circle mr-4 text-success"></i>
                      </div>
                    </div>
                    <div className="col-7">
                      <div className="numbers">
                        <p className="card-category">Accuracy</p>
                        <h4 className="card-title">
                          {metrics.accuracy.toFixed(2)}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <hr />
                  <div className="stats">
                    <i className="fas fa-chart-area mr-1"></i>
                    Latest metrics
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6">
              <div className="card card-stats">
                <div className="card-body">
                  <div className="row">
                    <div className="col-5">
                      <div className="icon-big text-center icon-warning">
                        <i className="fas fa-exclamation-triangle mr-4 text-danger"></i>
                      </div>
                    </div>
                    <div className="col-7">
                      <div className="numbers">
                        <p className="card-category">Loss</p>
                        <h4 className="card-title">
                          {metrics.loss.toFixed(2)}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <hr />
                  <div className="stats">
                    <i className="fas fa-chart-area mr-1"></i>
                    Latest metrics
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 row p-0 m-0">
            <div className="col-xl-6">
              <div className="card card-stats">
                <div className="card-body">
                  <div className="row">
                    <div className="col-5">
                      <div className="icon-big text-center icon-warning">
                        <i className="fas fa-bullseye mr-4 text-warning"></i>
                      </div>
                    </div>
                    <div className="col-7">
                      <div className="numbers">
                        <p className="card-category">Precision</p>
                        <h4 className="card-title">
                          {metrics.precision.toFixed(2)}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <hr />
                  <div className="stats">
                    <i className="fas fa-chart-area mr-1"></i>
                    Latest metrics
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-6">
              <div className="card card-stats">
                <div className="card-body">
                  <div className="row">
                    <div className="col-5">
                      <div className="icon-big text-center icon-warning">
                        <i className="fas fa-reply mr-4 text-primary"></i>
                      </div>
                    </div>
                    <div className="col-7">
                      <div className="numbers">
                        <p className="card-category">Recall</p>
                        <h4 className="card-title">
                          {metrics.recall.toFixed(2)}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <hr />
                  <div className="stats">
                    <i className="fas fa-chart-area mr-1"></i>
                    Latest metrics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {spinner && <Spinner msg={spinner} />}

      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <Modal showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default Model;
