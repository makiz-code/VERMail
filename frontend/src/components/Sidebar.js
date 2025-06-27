import React from "react";
import { useLocation, NavLink } from "react-router-dom";
import sidebarImage from "../assets/img/sidebar.jpg";
import logoImageSM from "../assets/img/logoSmVERMail.png";
import logoImage from "../assets/img/logoVERMail.png";

function Sidebar({ routes }) {
  const location = useLocation();
  const activeRoute = (routeName) => {
    return location.pathname.indexOf(routeName) > -1 ? "active" : "";
  };
  return (
    <div className="sidebar" data-image={sidebarImage} data-color={"dark-gray"}>
      <div
        className="sidebar-background"
        style={{
          backgroundImage: "url(" + sidebarImage + ")",
        }}
      />
      <div className="sidebar-wrapper">
        <div className="logo d-flex justify-content-start align-items-center">
          <div className="w-25">
            <a href="http://www.vermeg.com" target="_blank">
              <img src={logoImageSM} className="img-fluid p-3 mt-2" alt="..." />
            </a>
          </div>
          <div className="w-50">
            <a href="http://www.vermeg.com" target="_blank">
              <img src={logoImage} className="img-fluid p-2" alt="..." />
            </a>
          </div>
        </div>
        <ul className="nav">
          {routes.map((prop, key) => {
            if (!prop.redirect)
              return (
                <li
                  className={"nav-item " + activeRoute(prop.layout + prop.path)}
                  key={key}
                >
                  <NavLink
                    to={prop.layout + prop.path}
                    className="nav-link"
                    activeClassName="active"
                  >
                    <i className={prop.icon} />
                    <span className="pl-2">{prop.name}</span>
                  </NavLink>
                </li>
              );
            return null;
          })}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
