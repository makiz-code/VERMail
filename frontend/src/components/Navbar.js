import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useHistory } from "react-router-dom";
import { logoutAsync } from "../redux/login/actions";
import logoImageSM from "../assets/img/logoSmVERMail.png";

function Navmenu({ routes }) {
  const location = useLocation();
  const history = useHistory();

  const { token } = useSelector((state) => state.login);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
      return history.push("/login");
    }
  }, [token, history]);

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
      <div className="container-fluid d-flex justify-content-between align-items-center position-relative">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-dark d-lg-none btn-fill p-2 d-flex justify-content-center align-items-center"
            onClick={mobileSidebarToggle}
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
          <a
            href="#home"
            onClick={(e) => e.preventDefault()}
            className="navbar-brand"
          >
            {getBrandText()}
          </a>
        </div>
        <div className="position-absolute top-50 start-50 translate-middle d-flex align-items-center">
          <img
            src={logoImageSM}
            alt="VERMail Logo"
            className="img-fluid"
            style={{ maxHeight: "30px" }}
          />
        </div>
        <div className="d-flex align-items-center">
          <a
            className="navbar-brand"
            href="#"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            <span className="no-icon">Logout</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navmenu;
