import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addAccountAsync,
  getAccountsAsync,
  getAccountAsync,
  updateAccountAsync,
  deleteAccountAsync,
} from "../redux/account/actions";
import NotificationAlert from "react-notification-alert";
import Modal from "../components/Modal";
import { FaEye, FaEyeSlash, FaDatabase, FaEdit, FaTrash } from "react-icons/fa";

const initialState = {
  username: "",
  password: "",
  role: "",
};

function Accounts() {
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState(initialState);
  const [editMode, setEditMode] = useState(false);
  const [accountId, setAccountId] = useState(null);

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

  const { accounts, account, notif, error } = useSelector(
    (state) => state.account
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAccountsAsync());
  }, [dispatch]);

  useEffect(() => {
    if (account) {
      setState({ ...account });
    }
  }, [account]);

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
      setAccountId(null);
      setEditMode(false);
      setShowPassword(false);
    }
  }, [notif]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!state.username || !state.password || !state.role) {
      notify({ type: "danger", msg: "Please fill all required fields" }, "tr");
    } else {
      if (editMode && accountId) {
        const accountDataChanged =
          state.username !== account.username ||
          state.password !== account.password ||
          state.role !== account.role;
        if (accountDataChanged) {
          setShowModal({
            text: `Do you want to update account <b>${state.username}</b>?`,
            confirm: "Yes",
            cancel: "No",
            action: () => {
              dispatch(updateAccountAsync(accountId, state));
            },
          });
        } else {
          notify(
            { type: "warning", msg: "No changes were made to the account" },
            "tr"
          );
        }
      } else {
        dispatch(addAccountAsync(state));
      }
    }
  };

  const handleUpdate = (id) => {
    if (editMode && accountId === id) {
      setState(initialState);
      setAccountId(null);
      setEditMode(false);
    } else {
      dispatch(getAccountAsync(id));
      setAccountId(id);
      setEditMode(true);
    }
    setShowPassword(false);
  };

  const handleDelete = (id) => {
    dispatch(deleteAccountAsync(id));
  };

  const handleCheckboxChange = (item) => {
    const updatedState = { ...item, state: !item.state };
    dispatch(updateAccountAsync(item._id, updatedState));
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Manage Accounts</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="usernameInput" className="form-label">
                        Username
                      </label>
                      <input
                        id="usernameInput"
                        name="username"
                        type="text"
                        className={
                          "form-control" +
                          (error?.field === "username" ? " is-invalid" : "")
                        }
                        placeholder="med_khalil_zrelly"
                        value={state.username}
                        onChange={handleChange}
                      />
                      {error?.field === "username" && (
                        <div className="invalid-feedback">{error.msg}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="passwordInput" className="form-label">
                        Password
                      </label>
                      <div className="input-group">
                        <input
                          id="passwordInput"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className={
                            "form-control" +
                            (error?.field === "password" ? " is-invalid" : "")
                          }
                          placeholder="x$%d-y&#w_k\"
                          value={state.password}
                          onChange={handleChange}
                        />
                        <div className="input-group-append">
                          <span
                            className="input-group-text"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: "pointer" }}
                          >
                            {showPassword ? <FaEye /> : <FaEyeSlash />}
                          </span>
                        </div>
                        {error?.field === "password" && (
                          <div className="invalid-feedback">{error.msg}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="roleInput" className="form-label">
                        Role
                      </label>
                      <select
                        id="roleInput"
                        name="role"
                        className="form-control custom-select"
                        value={state.role}
                        onChange={handleChange}
                      >
                        <option value="">Asign Role</option>
                        <option value="1">Technical Admin</option>
                        <option value="2">Business Admin</option>
                        <option value="3">System User</option>
                      </select>
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
                  {editMode ? "Update" : "Add"} Account
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
                  <th className="col-7">Username</th>
                  <th className="col-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts?.map((item, index) => (
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
                    <td>{item.username}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className={`btn mr-1 d-flex justify-content-center align-items-center ${
                            editMode && accountId === item._id
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
                              text: `Do you want to delete account <b>${item.username}</b>?`,
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

export default Accounts;
