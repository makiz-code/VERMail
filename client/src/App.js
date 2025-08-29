import { useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import Sidebar from "./components/Sidebar.js";
import Navbar from "./components/Navbar.js";
import Footer from "./components/Footer.js";
import Login from "./components/Login";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import techAdminRoutes from "./routes/techAdminRoutes.js";
import busiAdminRoutes from "./routes/busiAdminRoutes.js";
import sysUserRoutes from "./routes/sysUserRoutes.js";
import jwt_decode from "jwt-decode";

function App() {
  const mainPanel = useRef(null);

  const { token } = useSelector((state) => state.login);

  const role = useMemo(() => {
    if (token) {
      try {
        const decoded = jwt_decode(token);
        return String(decoded.role);
      } catch (err) {
        console.error("Failed to decode token:", err);
        return null;
      }
    }
    return null;
  }, [token]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (mainPanel.current) {
      mainPanel.current.scrollTop = 0;
    }
    if (
      window.innerWidth < 993 &&
      document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      var element = document.getElementById("bodyClick");
      element.parentNode.removeChild(element);
    }
  }, []);

  const generateMainPanelContent = (routes) => (
    <div className="wrapper">
      <Sidebar routes={routes} />
      <div className="main-panel" ref={mainPanel}>
        <Navbar routes={routes} />
        <div className="content">
          <Switch>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.layout + route.path}
                exact={route.exact}
                component={route.component}
              />
            ))}
          </Switch>
        </div>
        <Footer />
      </div>
    </div>
  );

  return (
    <Router>
      <Switch>
        <Route exact path="/login" component={Login} />

        <Route path="/super-admin">
          {() =>
            token && role === "SuperAdmin" ? (
              <Switch>
                <Route exact path={superAdminRoutes[0].layout}>
                  <Redirect
                    to={superAdminRoutes[0].layout + superAdminRoutes[0].path}
                  />
                </Route>
                {generateMainPanelContent(superAdminRoutes)}
              </Switch>
            ) : (
              <Redirect to="/login" />
            )
          }
        </Route>

        <Route path="/tech-admin">
          {() =>
            token && role === "TechAdmin" ? (
              <Switch>
                <Route exact path={techAdminRoutes[0].layout}>
                  <Redirect
                    to={techAdminRoutes[0].layout + techAdminRoutes[0].path}
                  />
                </Route>
                {generateMainPanelContent(techAdminRoutes)}
              </Switch>
            ) : (
              <Redirect to="/login" />
            )
          }
        </Route>

        <Route path="/busi-admin">
          {() =>
            token && role === "BusiAdmin" ? (
              <Switch>
                <Route exact path={busiAdminRoutes[0].layout}>
                  <Redirect
                    to={busiAdminRoutes[0].layout + busiAdminRoutes[0].path}
                  />
                </Route>
                {generateMainPanelContent(busiAdminRoutes)}
              </Switch>
            ) : (
              <Redirect to="/login" />
            )
          }
        </Route>

        <Route path="/sys-user">
          {() =>
            token && role === "SysUser" ? (
              <Switch>
                <Route exact path={sysUserRoutes[0].layout}>
                  <Redirect
                    to={sysUserRoutes[0].layout + sysUserRoutes[0].path}
                  />
                </Route>
                {generateMainPanelContent(sysUserRoutes)}
              </Switch>
            ) : (
              <Redirect to="/login" />
            )
          }
        </Route>

        <Redirect from="/" to="/login" />
      </Switch>
    </Router>
  );
}

export default App;
