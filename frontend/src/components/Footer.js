import React, { Component } from "react";

class Footer extends Component {
  render() {
    return (
      <footer className="footer px-0 px-lg-3">
        <div className="container-fluid">
          <nav>
            <ul className="footer-menu">
              <li>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Home
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Company
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Portfolio
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Blog
                </a>
              </li>
            </ul>
            <p className="copyright text-center">
              © {new Date().getFullYear()}{" "}
              <a href="http://www.vermeg.com" target="_blank">
                VERMail
              </a>
              , Everything is connected
            </p>
          </nav>
        </div>
      </footer>
    );
  }
}

export default Footer;
