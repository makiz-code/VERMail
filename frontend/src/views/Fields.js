import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addFieldAsync,
  getFieldsAsync,
  getFieldAsync,
  updateFieldAsync,
  deleteFieldAsync,
} from "../redux/field/actions";
import { getTopicsAsync } from "../redux/topic/actions";
import NotificationAlert from "react-notification-alert";
import Modal from "../components/Modal";
import { FaDatabase, FaEdit, FaTrash } from "react-icons/fa";

const initialState = {
  topic: "",
  name: "",
  query: "",
};

function Fields() {
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState(initialState);
  const [editMode, setEditMode] = useState(false);
  const [fieldId, setFieldId] = useState(null);

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

  const { fields, field, notif, error } = useSelector((state) => state.field);
  const { topics } = useSelector((state) => state.topic);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTopicsAsync());
  }, []);

  useEffect(() => {
    dispatch(getFieldsAsync());
  }, [dispatch]);

  useEffect(() => {
    if (field) {
      setState({ ...field });
    }
  }, [field]);

  useEffect(() => {
    setState(initialState);
  }, [location.pathname]);

  useEffect(() => {
    setEditMode(false);
  }, [state.topic]);

  useEffect(() => {
    if (notif?.msg) {
      notify(notif, "tr");
    }
  }, [notif]);

  useEffect(() => {
    if (notif?.type === "success" || notif?.type === "warning") {
      setState((prevState) => ({ ...prevState, ["name"]: "", ["query"]: "" }));
      setFieldId(null);
      setEditMode(false);
    }
  }, [notif]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!state.topic || !state.name || !state.query) {
      notify({ type: "danger", msg: "Please fill all required fields" }, "tr");
    } else {
      if (editMode && fieldId) {
        const fieldDataChanged =
          state.topic !== field.topic ||
          state.name !== field.name ||
          state.query !== field.query;
        if (fieldDataChanged) {
          setShowModal({
            text: `Do you want to update field <b>${state.name}</b>?`,
            confirm: "Yes",
            cancel: "No",
            action: () => {
              dispatch(updateFieldAsync(fieldId, state));
            },
          });
        } else {
          notify(
            { type: "warning", msg: "No changes were made to the field" },
            "tr"
          );
        }
      } else {
        dispatch(addFieldAsync(state));
      }
    }
  };

  const handleUpdate = (id) => {
    if (editMode && fieldId === id) {
      setState((prevState) => ({ ...prevState, ["name"]: "", ["query"]: "" }));
      setFieldId(null);
      setEditMode(false);
    } else {
      dispatch(getFieldAsync(id));
      setFieldId(id);
      setEditMode(true);
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteFieldAsync(id));
  };

  const handleCheckboxChange = (item) => {
    const updatedState = { ...item, state: !item.state };
    dispatch(updateFieldAsync(item._id, updatedState));
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Manage Fields</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="topicInput" className="form-label">
                        Topic
                      </label>
                      <select
                        id="topicInput"
                        name="topic"
                        className="form-control custom-select"
                        value={state.topic}
                        onChange={handleChange}
                      >
                        <option value="">Select Topic</option>

                        {topics
                          .filter((item) => item.state === true)
                          .map((item, index) => (
                            <option key={index} value={item.name}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
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
                        placeholder="Enter name"
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
                      <label htmlFor="queryInput" className="form-label">
                        Query
                      </label>
                      <textarea
                        id="queryInput"
                        name="query"
                        rows="3"
                        className={
                          "form-control" +
                          (error?.field === "query" ? " is-invalid" : "")
                        }
                        placeholder="Field query goes here...?"
                        value={state.query}
                        onChange={handleChange}
                      />
                      {error?.field === "query" && (
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
                  {editMode ? "Update" : "Add"} Field
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
                  <th className="col-7">Field Name</th>
                  <th className="col-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {fields &&
                  (state.topic != ""
                    ? fields.filter((item) => item.topic === state.topic)
                    : fields
                  ).map((item, index) => (
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
                              editMode && fieldId === item._id
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
                                text: `Do you want to delete field <b>${item.name}</b>?`,
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

export default Fields;
