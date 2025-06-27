import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useHistory } from "react-router-dom";
import { logoutAsync } from "../redux/login/actions";

function Navmenu({ routes }) {
  const location = useLocation();
  const history = useHistory();

  const { access } = useSelector((state) => state.login);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!access?.token) {
      return history.push("/login");
    }
  }, [access, history]);

  const mobileSidebarToggle = (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle("nav-open");
    var node = document.createElement("div");
    node.id = "bodyClick";
    node.onclick = function () {
      this.parentElement.removeChild(this);
      document.documentElement.classList.toggle("nav-open");
    };
    document.body.appendChild(node);
  };

  const getBrandText = () => {
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return "VERMail";
  };

  const handleLogout = () => {
    dispatch(logoutAsync());
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center ml-2 ml-lg-0">
          <button
            className="btn btn-dark d-lg-none btn-fill d-flex justify-content-center align-items-center p-2"
            onClick={mobileSidebarToggle}
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
          <a
            href="#home"
            onClick={(e) => e.preventDefault()}
            className="navbar-brand mr-2"
          >
            {getBrandText()}
          </a>
        </div>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <a
                className="nav-link m-0"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <i className="nc-icon nc-zoom-split mr-2"></i>
                <span className="d-lg-block">Search</span>
              </a>
            </li>
          </ul>
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <a
                className="nav-link m-0"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <span className="no-icon">Account</span>
              </a>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle m-0"
                href="#"
                id="navbarDropdownMenuLink"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="no-icon">Links</span>
              </a>
              <div
                className="dropdown-menu"
                aria-labelledby="navbarDropdownMenuLink"
              >
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Home
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Company
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Portfolio
                </a>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Blog
                </a>
              </div>
            </li>
            <li className="nav-item">
              <a className="nav-link m-0" href="#" onClick={handleLogout}>
                <span className="no-icon">Log out</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navmenu;
