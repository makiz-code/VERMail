import { Component } from "react";

class Footer extends Component {
  render() {
    return (
      <footer className="footer px-0 px-lg-3">
        <div className="container-fluid">
          <nav>
            <ul className="footer-menu">
              <li>
                <a
                  href="https://www.vermeg.com/solutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary text-decoration-none"
                >
                  Solutions
                </a>
              </li>
              <li>
                <a
                  href="https://www.vermeg.com/about-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary text-decoration-none"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="https://www.vermeg.com/careers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary text-decoration-none"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="https://www.vermeg.com/contact-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary text-decoration-none"
                >
                  Contact Us
                </a>
              </li>
            </ul>

            <p className="copyright text-center pr-0">
              © {new Date().getFullYear()}{" "}
              <a
                href="http://www.vermeg.com"
                target="_blank"
                className="text-decoration-none fw-bold"
                style={{ color: "rgba(73, 10, 156, 0.82)" }}
              >
                VERMEG
              </a>
              , for Financial Software Solutions
            </p>
          </nav>
        </div>
      </footer>
    );
  }
}

export default Footer;
