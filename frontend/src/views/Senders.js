import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addSenderAsync,
  getSendersAsync,
  getSenderAsync,
  updateSenderAsync,
  deleteSenderAsync,
} from "../redux/sender/actions";
import { getMailboxesAsync } from "../redux/mailbox/actions";
import NotificationAlert from "react-notification-alert";
import Modal from "../components/Modal";
import { FaDatabase, FaEdit, FaTrash } from "react-icons/fa";

const initialState = {
  mailbox: "",
  email: "",
  company: "",
};

function Senders() {
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState(initialState);
  const [editMode, setEditMode] = useState(false);
  const [senderId, setSenderId] = useState(null);

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

  const { senders, sender, notif, error } = useSelector(
    (state) => state.sender
  );
  const { mailboxes } = useSelector((state) => state.mailbox);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMailboxesAsync());
  }, []);

  useEffect(() => {
    dispatch(getSendersAsync());
  }, [dispatch]);

  useEffect(() => {
    if (sender) {
      setState({ ...sender });
    }
  }, [sender]);

  useEffect(() => {
    setState(initialState);
  }, [location.pathname]);

  useEffect(() => {
    setEditMode(false);
  }, [state.mailbox]);

  useEffect(() => {
    if (notif?.msg) {
      notify(notif, "tr");
    }
  }, [notif]);

  useEffect(() => {
    if (notif?.type === "success" || notif?.type === "warning") {
      setState((prevState) => ({ ...prevState, ["email"]: "",  ["company"]: "" }));
      setSenderId(null);
      setEditMode(false);
    }
  }, [notif]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!state.mailbox || !state.email) {
      notify({ type: "danger", msg: "Please fill all required fields" }, "tr");
    } else {
      if (editMode && senderId) {
        const senderDataChanged =
          state.mailbox !== sender.mailbox ||
          state.email !== sender.email ||
          state.company !== sender.company;
        if (senderDataChanged) {
          setShowModal({
            text: `Do you want to update sender <b>${state.email}</b>?`,
            confirm: "Yes",
            cancel: "No",
            action: () => {
              dispatch(updateSenderAsync(senderId, state));
            },
          });
        } else {
          notify(
            { type: "warning", msg: "No changes were made to the sender" },
            "tr"
          );
        }
      } else {
        dispatch(addSenderAsync(state));
      }
    }
  };

  const handleUpdate = (id) => {
    if (editMode && senderId === id) {
      setState((prevState) => ({ ...prevState, ["email"]: "", ["company"]: "" }));
      setSenderId(null);
      setEditMode(false);
    } else {
      dispatch(getSenderAsync(id));
      setSenderId(id);
      setEditMode(true);
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteSenderAsync(id));
  };

  const handleCheckboxChange = (item) => {
    const updatedState = { ...item, state: !item.state };
    dispatch(updateSenderAsync(item._id, updatedState));
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Manage Senders</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="mailboxInput" className="form-label">
                        Mailbox
                      </label>
                      <select
                        id="mailboxInput"
                        name="mailbox"
                        className="form-control custom-select"
                        value={state.mailbox}
                        onChange={handleChange}
                      >
                        <option value="">Select Mailbox</option>

                        {mailboxes
                          .filter((item) => item.state === true)
                          .map((item, index) => (
                            <option key={index} value={item.email}>
                              {item.email}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="emailInput" className="form-label">
                        Email
                      </label>
                      <input
                        id="emailInput"
                        name="email"
                        type="text"
                        className={
                          "form-control" +
                          (error?.field === "email" ? " is-invalid" : "")
                        }
                        placeholder="Enter email"
                        value={state.email}
                        onChange={handleChange}
                      />
                      {error?.field === "email" && (
                        <div className="invalid-feedback">{error.msg}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="companyInput" className="form-label">
                        Company
                      </label>
                      <input
                        id="companyInput"
                        name="company"
                        type="text"
                        className={
                          "form-control" +
                          (error?.field === "company" ? " is-invalid" : "")
                        }
                        placeholder="Enter company"
                        value={state.company}
                        onChange={handleChange}
                      />
                      {error?.field === "company" && (
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
                  {editMode ? "Update" : "Add"} Sender
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
                  <th className="col-7">Email Address</th>
                  <th className="col-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {senders &&
                  (state.mailbox !== ""
                    ? senders.filter((item) => item.mailbox === state.mailbox)
                    : senders
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
                      <td>{item.email}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className={`btn mr-1 d-flex justify-content-center align-items-center ${
                              editMode && senderId === item._id
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
                                text: `Do you want to delete sender <b>${item.email}</b>?`,
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

export default Senders;
