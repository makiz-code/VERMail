import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  uploadFileAsync,
  uploadFilesAsync,
  getFilesAsync,
  deleteFileAsync,
  cleanDatasetAsync,
  labelDatasetAsync,
  transformDatasetAsync,
} from "../redux/dataset/actions";
import logoJSON from "../assets/img/json.png";
import logoXLS from "../assets/img/xls.png";
import logoEML from "../assets/img/eml.png";
import logoMSG from "../assets/img/msg.png";
import ChartistGraph from "react-chartist";
import NotificationAlert from "react-notification-alert";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import Card from "../components/Card";
import { FaArrowAltCircleRight, FaTimes } from "react-icons/fa";
import { verticalBarEventHandlers } from "../utils/EventHandlers";
import { verticalBarOptions } from "../utils/ChartOptions";
import { getData } from "../utils/ChartData";

const Dataset = () => {
  const fileUploadRef = useRef(null);
  const folderUploadRef = useRef(null);

  const [activeTab, setActiveTab] = useState("file");
  const [spinner, setSpinner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [shouldContinue, setShouldContinue] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [data, setData] = useState(null);

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

  const { files, emails, topics, notif, stats } = useSelector(
    (state) => state.dataset
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getFilesAsync());
    setSpinner(`Files are being fetched...`);
    setShowStats(false);
  }, [dispatch]);

  useEffect(() => {
    if (
      notif?.msg?.includes("fetched successfully") &&
      spinner?.includes("Files are being fetched")
    ) {
      setSpinner(null);
    }
  }, [notif]);

  useEffect(() => {
    if (
      notif?.msg &&
      !notif.msg?.includes("fetched successfully") &&
      !notif.msg?.includes("File changes saved")
    ) {
      notify(notif, "tr");
      setSpinner(null);
      fileUploadRef.current.value = "";
      folderUploadRef.current.value = "";
    }
  }, [notif]);

  useEffect(() => {
    if (processing && emails.length > 0) {
      if (emails.filter((row) => row.topic === null).length == 0) {
        dispatch(transformDatasetAsync(dataset));
        setSpinner(`File <b>${dataset}</b> is being transformed...`);
      }
      setJsonData(emails);
    }
  }, [emails]);

  useEffect(() => {
    if (spinner?.includes("being extracted")) {
      setShowStats(false);
    }
  }, [spinner]);

  useEffect(() => {
    if (spinner?.includes("being cleaned")) {
      setShowStats(false);
      setProcessing(true);
    }
  }, [spinner]);

  useEffect(() => {
    if (stats?.dataset) {
      setProcessing(false);
      setJsonData(null);
      setDataset(null);
      setShowStats(true);
      setData(getData(stats.topics));
      setShouldContinue(true);
      setCurrentCardIndex(0);
    }
  }, [stats]);

  useEffect(() => {
    if (dataset && jsonData) {
      dispatch(labelDatasetAsync(dataset, jsonData));
    }
  }, [dataset, jsonData]);

  useEffect(() => {
    if (jsonData) {
      if (jsonData.filter((row) => row.topic === null).length > 0) {
        setShouldContinue(true);
      } else {
        setShouldContinue(false);
      }
    }
  }, [notif]);

  useEffect(() => {
    if (
      dataset &&
      !shouldContinue &&
      emails?.filter((row) => row.topic === null).length !== 0
    ) {
      dispatch(transformDatasetAsync(dataset));
      setSpinner(`File <b>${dataset}</b> is being transformed...`);
    }
  }, [shouldContinue]);

  useEffect(() => {
    if (notif?.type == "warning" || notif?.type == "danger") {
      setProcessing(false);
      setJsonData(null);
      setDataset(null);
    }
  }, [notif]);

  useEffect(() => {
    if (
      shouldContinue &&
      currentCardIndex < jsonData?.length &&
      jsonData[currentCardIndex].topic !== null
    ) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  }, [currentCardIndex, jsonData, shouldContinue]);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    const allowedTypes = [
      "application/json",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (file) {
      if (
        allowedTypes.includes(file.type) &&
        /\.(json|csv|xls|xlsx)$/i.test(file.name)
      ) {
        const formData = new FormData();
        formData.append("file", file);
        dispatch(uploadFileAsync(formData));
        setSpinner(`File <b>${file.name}</b> is being extracted...`);
      } else {
        e.target.value = "";
        notify(
          {
            type: "warning",
            msg: "Please upload a file of type JSON, CSV, XLS, or XLSX.",
          },
          "tr"
        );
      }
    }
  };

  const onFolderChange = (e) => {
    const files = e.target.files;
    const allowedExtensions = ["msg", "eml"];
    let isValidFolder = true;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedExtensions.some((ext) => file.name.endsWith(ext))) {
        isValidFolder = false;
        break;
      }
    }

    if (isValidFolder && files.length > 0) {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("folder", file);
      });
      dispatch(uploadFilesAsync(formData));
      setSpinner(`<b>${files.length}</b> file(s) are being extracted...`);
    } else {
      e.target.value = "";
      notify(
        {
          type: "warning",
          msg: "Please upload files of only type MSG or EML.",
        },
        "tr"
      );
    }
  };

  const handleCleaning = (filename) => {
    if (dataset !== filename) {
      dispatch(cleanDatasetAsync(filename));
      setSpinner(`File <b>${filename}</b> is being cleaned...`);
      setDataset(filename);
    }
  };

  const handleDelete = (filename) => {
    dispatch(deleteFileAsync(filename));
  };

  const handleNext = (selectedValues) => {
    const updatedData = [...jsonData];

    const indexToRemove = updatedData.findIndex(
      (item) =>
        item.topic === null &&
        item.subject === updatedData[currentCardIndex].subject &&
        item.body === updatedData[currentCardIndex].body
    );
    if (indexToRemove !== -1) {
      updatedData.splice(indexToRemove, 1);
    }

    selectedValues.forEach((value) => {
      updatedData.push({
        subject: jsonData[currentCardIndex].subject,
        body: jsonData[currentCardIndex].body,
        topic: value,
      });
    });

    setJsonData(updatedData);
  };

  const handleQuit = () => {
    setProcessing(false);
    setJsonData(null);
    setDataset(null);
  };

  const handleSkip = () => {
    dispatch(transformDatasetAsync(dataset));
    setSpinner(`File <b>${dataset}</b> is being transformed...`);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-6 row p-0 m-0">
          <div className="col-xl-6">
            <div className="card card-stats">
              <div className="card-body">
                <div className="row">
                  <div className="col-5">
                    <div className="logo-img mb-3">
                      <img
                        src={logoJSON}
                        alt="Json Img"
                        style={{ height: "50px" }}
                      />
                    </div>
                  </div>
                  <div className="col-7">
                    <div className="numbers">
                      <p className="card-category">JSON</p>
                      <h4 className="card-title">Keyed</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <hr />
                <div className="stats">
                  <i className="far fa-file mr-1"></i>
                  Labeled/ Unlabeled
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-6">
            <div className="card card-stats">
              <div className="card-body">
                <div className="row">
                  <div className="col-5">
                    <div className="logo-img mb-3">
                      <img
                        src={logoXLS}
                        alt="Json Img"
                        style={{ height: "50px" }}
                      />
                    </div>
                  </div>
                  <div className="col-7">
                    <div className="numbers">
                      <p className="card-category">CSV/ XLS/ XLSX</p>
                      <h4 className="card-title">Tabular</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <hr />
                <div className="stats">
                  <i className="far fa-file mr-1"></i>
                  Labeled/ Unlabeled
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
                    <div className="logo-img mb-3">
                      <img
                        src={logoEML}
                        alt="Json Img"
                        style={{ height: "50px" }}
                      />
                    </div>
                  </div>
                  <div className="col-7">
                    <div className="numbers">
                      <p className="card-category">EML</p>
                      <h4 className="card-title">Email</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <hr />
                <div className="stats">
                  <i className="far fa-file mr-1"></i>
                  Unlabeled
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-6">
            <div className="card card-stats">
              <div className="card-body">
                <div className="row">
                  <div className="col-5">
                    <div className="logo-img mb-3">
                      <img
                        src={logoMSG}
                        alt="Json Img"
                        style={{ height: "50px" }}
                      />
                    </div>
                  </div>
                  <div className="col-7">
                    <div className="numbers">
                      <p className="card-category">MSG</p>
                      <h4 className="card-title">Outlook</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <hr />
                <div className="stats">
                  <i className="far fa-file mr-1"></i>
                  Unlabeled
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "file" ? "active text-white bg-primary" : ""
            }`}
            onClick={() => setActiveTab("file")}
          >
            Table
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "folder" ? "active text-white bg-primary" : ""
            }`}
            onClick={() => setActiveTab("folder")}
          >
            Email
          </button>
        </li>
      </ul>

      <div className="tab-content mt-3">
        <div
          className={`tab-pane fade ${
            activeTab === "file" ? "show active" : ""
          }`}
          id="file"
        >
          <div className="card">
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="fileUpload" className="form-label">
                  Upload File (JSON, CSV, XLS, XLSX)
                </label>
                <input
                  type="file"
                  id="fileUpload"
                  ref={fileUploadRef}
                  onChange={onFileChange}
                  className="form-control"
                  style={{ padding: "4px 10px", lineHeight: "2" }}
                  accept=".json, .csv, .xls, .xlsx"
                  required
                  disabled={processing}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`tab-pane fade ${
            activeTab === "folder" ? "show active" : ""
          }`}
          id="folder"
        >
          <div className="card">
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="folderUpload" className="form-label">
                  Upload Files (MSG, EML)
                </label>
                <input
                  type="file"
                  id="folderUpload"
                  ref={folderUploadRef}
                  onChange={onFolderChange}
                  className="form-control"
                  style={{ padding: "4px 10px", lineHeight: "2" }}
                  accept=".msg, .eml"
                  multiple={true}
                  directory={true}
                  webkitdirectory={true}
                  required
                  disabled={processing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {files?.length > 0 && (
        <div className="row">
          <div className="table-responsive table-full-width">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th className="col-1">num</th>
                  <th className="col-4">Filename</th>
                  <th className="col-2">Rows</th>
                  <th className="col-2">Labeled</th>
                  <th className="col-2">Unlabeled</th>
                  <th className="col-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {files.map((item, index) => (
                  <tr key={index}>
                    <td>{index}</td>
                    <td>{item.filename}</td>
                    <td className="text-primary">{item["rows_count"]}</td>
                    <td className="text-success">{item["labeled_count"]}</td>
                    <td className="text-danger">{item["unlabeled_count"]}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className={`btn mr-1 d-flex justify-content-center align-items-center ${
                            dataset === item.filename
                              ? "btn-white text-white bg-primary border-primary"
                              : "btn-secondary text-secondary"
                          }`}
                          onClick={() => handleCleaning(item.filename)}
                          disabled={dataset === item.filename || processing}
                        >
                          <FaArrowAltCircleRight />
                        </button>
                        <button
                          className="btn btn-danger text-danger"
                          onClick={() =>
                            setShowModal({
                              text: `Do you want to delete mailbox <b>${item.filename}</b>?`,
                              confirm: "Yes",
                              cancel: "No",
                              action: () => handleDelete(item.filename),
                            })
                          }
                          disabled={dataset === item.filename || processing}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {jsonData && !spinner && shouldContinue && (
        <div className="card my-3 position-relative">
          {jsonData.map((item, index) => {
            if (index === currentCardIndex) {
              return (
                <div>
                  <Card
                    key={index}
                    current={`${
                      jsonData?.filter((row) => row.topic === null).length
                    } remaining`}
                    subject={item.subject}
                    body={item.body}
                    options={topics}
                    onNext={handleNext}
                    onSkip={handleSkip}
                  />
                  <button
                    className="btn btn-danger position-absolute top-0 end-0 mt-1 mr-2 border-0"
                    onClick={handleQuit}
                  >
                    <FaTimes />
                  </button>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {spinner && <Spinner msg={spinner} />}

      {stats?.dataset && showStats && (
        <div className="mt-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Dataset Statistics</h4>
              <p className="card-category">filename: {stats.dataset}</p>
            </div>
            <div className="card-body">
              <div className="ct-chart">
                <ChartistGraph
                  type="Bar"
                  data={data}
                  options={verticalBarOptions}
                  listener={verticalBarEventHandlers}
                />
              </div>
            </div>
            <div className="card-footer">
              <div className="stats">
                <i className="far fa-chart-bar"></i> rows count :{" "}
                <b>{stats.rows}</b>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <Modal showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default Dataset;
