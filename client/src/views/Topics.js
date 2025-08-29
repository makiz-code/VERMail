import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addTopicAsync,
  getTopicsAsync,
  getTopicAsync,
  updateTopicAsync,
  deleteTopicAsync,
} from "../redux/topic/actions";
import NotificationAlert from "react-notification-alert";
import Modal from "../components/Modal";
import { FaDatabase, FaEdit, FaTrash } from "react-icons/fa";

const initialState = {
  name: "",
  desc: "",
};

function Topics() {
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState(initialState);
  const [editMode, setEditMode] = useState(false);
  const [topicId, setTopicId] = useState(null);

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

  const { topics, topic, notif, error } = useSelector((state) => state.topic);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTopicsAsync());
  }, [dispatch]);

  useEffect(() => {
    if (topic) {
      setState({ ...topic });
    }
  }, [topic]);

  useEffect(() => {
    setState(initialState);
  }, [location.pathname]);

  useEffect(() => {
    if (notif?.msg) {
      notify(notif, "tr");
    }
  }, [notif]);

  useEffect(() => {
    if (notif?.type === "success" || notif?.type === "warning") {
      setState(initialState);
      setTopicId(null);
      setEditMode(false);
    }
  }, [notif]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!state.name || !state.desc) {
      notify({ type: "danger", msg: "Please fill all required fields" }, "tr");
    } else {
      if (editMode && topicId) {
        const topicDataChanged =
          state.name !== topic.name || state.desc !== topic.desc;
        if (topicDataChanged) {
          setShowModal({
            text: `Do you want to update topic <b>${state.name}</b>?`,
            confirm: "Yes",
            cancel: "No",
            action: () => {
              dispatch(updateTopicAsync(topicId, state));
            },
          });
        } else {
          notify(
            { type: "warning", msg: "No changes were made to the topic" },
            "tr"
          );
        }
      } else {
        dispatch(addTopicAsync(state));
      }
    }
  };

  const handleUpdate = (id) => {
    if (editMode && topicId === id) {
      setState(initialState);
      setTopicId(null);
      setEditMode(false);
    } else {
      dispatch(getTopicAsync(id));
      setTopicId(id);
      setEditMode(true);
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteTopicAsync(id));
  };

  const handleCheckboxChange = (item) => {
    const updatedState = { ...item, state: !item.state };
    dispatch(updateTopicAsync(item._id, updatedState));
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Manage Topics</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="nameInput" className="form-label">
                        Name
                      </label>
                      <input
                        id="nameInput"
                        name="name"
                        type="text"
                        className={
                          "form-control" +
                          (error?.field === "name" ? " is-invalid" : "")
                        }
                        placeholder="Topic name"
                        value={state.name}
                        onChange={handleChange}
                      />
                      {error?.field === "name" && (
                        <div className="invalid-feedback">{error.msg}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="descInput" className="form-label">
                        Description
                      </label>
                      <textarea
                        id="descInput"
                        name="desc"
                        rows="4"
                        className={
                          "form-control" +
                          (error?.field === "desc" ? " is-invalid" : "")
                        }
                        placeholder="Topic description goes here..."
                        value={state.desc}
                        onChange={handleChange}
                      />
                      {error?.field === "desc" && (
                        <div className="invalid-feedback">{error.msg}</div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className={`col-md-12 btn ${
                    editMode ? "btn-success" : "btn-primary"
                  } btn-fill my-1 d-flex justify-content-center align-items-center`}
                  type="submit"
                >
                  {editMode ? (
                    <FaEdit className="mr-2" />
                  ) : (
                    <FaDatabase className="mr-2" />
                  )}
                  {editMode ? "Update" : "Add"} Topic
                </button>
                <div className="clearfix"></div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="table-responsive">
            <table className="table table-hover table-full-width">
              <thead>
                <tr>
                  <th className="col-2">A/D</th>
                  <th className="col-7">Topic Name</th>
                  <th className="col-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {topics?.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="form-check my-auto p-0">
                        <label className="form-check-label">
                          <input
                            name="state"
                            type="checkbox"
                            className="form-check-input"
                            checked={item.state}
                            onChange={() => handleCheckboxChange(item)}
                          />
                          <span className="form-check-sign"></span>
                        </label>
                      </div>
                    </td>
                    <td>{item.name}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className={`btn mr-1 d-flex justify-content-center align-items-center ${
                            editMode && topicId === item._id
                              ? "btn-white text-white bg-secondary border-secondary"
                              : "btn-secondary"
                          }`}
                          onClick={() => handleUpdate(item._id)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            setShowModal({
                              text: `Do you want to delete topic <b>${item.name}</b>?`,
                              confirm: "Yes",
                              cancel: "No",
                              action: () => handleDelete(item._id),
                            })
                          }
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <Modal showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
}

export default Topics;
