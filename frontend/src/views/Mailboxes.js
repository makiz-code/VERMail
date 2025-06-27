import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addMailboxAsync,
  getMailboxesAsync,
  getMailboxAsync,
  updateMailboxAsync,
  deleteMailboxAsync,
} from "../redux/mailbox/actions";
import NotificationAlert from "react-notification-alert";
import Modal from "../components/Modal";
import { FaEye, FaEyeSlash, FaDatabase, FaEdit, FaTrash } from "react-icons/fa";

const initialState = {
  email: "",
  passkey: "",
  repository: "",
};

function Mailboxes() {
  const location = useLocation();

  const [showPasskey, setShowPasskey] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState(initialState);
  const [editMode, setEditMode] = useState(false);
  const [mailboxId, setMailboxId] = useState(null);

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

  const { mailboxes, mailbox, notif, error } = useSelector(
    (state) => state.mailbox
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMailboxesAsync());
  }, [dispatch]);

  useEffect(() => {
    if (mailbox) {
      setState({ ...mailbox });
    }
  }, [mailbox]);

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
      setMailboxId(null);
      setEditMode(false);
      setShowPasskey(false);
    }
  }, [notif]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!state.email || !state.passkey || !state.repository) {
      notify({ type: "danger", msg: "Please fill all required fields" }, "tr");
    } else {
      if (editMode && mailboxId) {
        const mailboxDataChanged =
          state.email !== mailbox.email ||
          state.passkey !== mailbox.passkey ||
          state.repository !== mailbox.repository;
        if (mailboxDataChanged) {
          setShowModal({
            text: `Do you want to update mailbox <b>${state.email}</b>?`,
            confirm: "Yes",
            cancel: "No",
            action: () => {
              dispatch(updateMailboxAsync(mailboxId, state));
            },
          });
        } else {
          notify(
            { type: "warning", msg: "No changes were made to the mailbox" },
            "tr"
          );
        }
      } else {
        dispatch(addMailboxAsync(state));
      }
    }
  };

  const handleUpdate = (id) => {
    if (editMode && mailboxId === id) {
      setState(initialState);
      setMailboxId(null);
      setEditMode(false);
    } else {
      dispatch(getMailboxAsync(id));
      setMailboxId(id);
      setEditMode(true);
    }
    setShowPasskey(false);
  };

  const handleDelete = (id) => {
    dispatch(deleteMailboxAsync(id));
  };

  const handleCheckboxChange = (item) => {
    const updatedState = { ...item, state: !item.state };
    dispatch(updateMailboxAsync(item._id, updatedState));
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Manage Mailboxes</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
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
                        placeholder="vermeg-company@contact.com"
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
                      <label htmlFor="passkeyInput" className="form-label">
                        Passkey
                      </label>
                      <div className="input-group">
                        <input
                          id="passkeyInput"
                          name="passkey"
                          type={showPasskey ? "text" : "password"}
                          className={
                            "form-control" +
                            (error?.field === "passkey" ? " is-invalid" : "")
                          }
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={state.passkey}
                          onChange={handleChange}
                        />
                        <div className="input-group-append">
                          <span
                            className="input-group-text"
                            onClick={() => setShowPasskey(!showPasskey)}
                            style={{ cursor: "pointer" }}
                          >
                            {showPasskey ? <FaEye /> : <FaEyeSlash />}
                          </span>
                        </div>
                        {error?.field === "passkey" && (
                          <div className="invalid-feedback">{error.msg}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="repositoryInput" className="form-label">
                        Repository
                      </label>
                      <input
                        id="repositoryInput"
                        name="repository"
                        type="text"
                        className={
                          "form-control" +
                          (error?.field === "repository" ? " is-invalid" : "")
                        }
                        placeholder="inbox"
                        value={state.repository}
                        onChange={handleChange}
                      />
                      {error?.field === "repository" && (
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
                  {editMode ? "Update" : "Add"} Mailbox
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
                {mailboxes?.map((item, index) => (
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
                            editMode && mailboxId === item._id
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
                              text: `Do you want to delete mailbox <b>${item.email}</b>?`,
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

export default Mailboxes;
