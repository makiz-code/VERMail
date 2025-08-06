import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  parseEmailsAsync,
  getEmailsAsync,
  validateEmailAsync,
  downloadFileAsync,
} from "../redux/dashboard/actions";
import { FaEye, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import ChartistGraph from "react-chartist";
import NotificationAlert from "react-notification-alert";
import {
  pieChartEventHandlers,
  stackedBarEventHandlers,
} from "../utils/EventHandlers";
import { pieChartOptions, stackedBarOptions } from "../utils/ChartOptions";

const rowsPerPage = 7;

function getEmailCounts(emails) {
  let { treated, incomplete, untreated } = {
    treated: 0,
    incomplete: 0,
    untreated: 0,
  };

  emails.forEach((email) => {
    const category = email?.state?.category;
    switch (category) {
      case "Treated":
        treated++;
        break;
      case "Incomplete":
        incomplete++;
        break;
      case "Untreated":
        untreated++;
        break;
      default:
        break;
    }
  });

  return { treated, incomplete, untreated };
}
const calculateEmails = (emails, hasIntentions, isValidated) => {
  return emails.filter((email) => {
    const hasIntentionsCheck = hasIntentions
      ? email.intentions && email.intentions.length > 0
      : !email.intentions || email.intentions.length === 0;
    const isValidatedCheck = email.validate === isValidated;
    return hasIntentionsCheck && isValidatedCheck;
  }).length;
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([
    "Treated",
    "Incomplete",
    "Untreated",
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentRows, setCurrentRows] = useState(null);
  const [datetimeFilter, setDatetimeFilter] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [filtersChanged, setFiltersChanged] = useState(false);
  const [currentID, setCurrentID] = useState(null);
  const [intentions, setIntentions] = useState(null);
  const [content, setContent] = useState(null);
  const [showContent, setShowContent] = useState(false);

  const [treated, setTreated] = useState(0);
  const [incomplete, setIncomplete] = useState(0);
  const [untreated, setUntreated] = useState(0);

  const [barSeries, setBarSeries] = useState([
    [0, 0],
    [0, 0],
  ]);

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

  const { emails, notif } = useSelector((state) => state.dashboard);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(parseEmailsAsync());
  }, []);

  useEffect(() => {
    if (
      notif?.msg?.includes("New emails added to database") ||
      notif?.msg?.includes("No existing new emails")
    ) {
      dispatch(parseEmailsAsync());
    }
  }, [notif]);

  useEffect(() => {
    dispatch(getEmailsAsync());
  }, [dispatch]);

  useEffect(() => {
    const storedPage = localStorage.getItem("currentPage");
    if (storedPage) {
      setCurrentPage(parseInt(storedPage));
    }
  }, [emails]);

  useEffect(() => {
    if (emails) {
      const { treated, incomplete, untreated } = getEmailCounts(emails);
      setTreated(treated);
      setIncomplete(incomplete);
      setUntreated(untreated);
    }
  }, [emails]);

  useEffect(() => {
    if (emails) {
      const seriesPredictedValidated = [
        calculateEmails(emails, true, true),
        calculateEmails(emails, false, true),
      ];
      const seriesUnpredictedValidated = [
        calculateEmails(emails, true, false),
        calculateEmails(emails, false, false),
      ];
      setBarSeries([seriesPredictedValidated, seriesUnpredictedValidated]);
    }
  }, [emails]);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (
      notif?.msg &&
      !notif?.msg?.includes("No existing new emails") &&
      !notif?.msg?.includes("No emails were found")
    ) {
      notify(notif, "tr");
    }
  }, [notif]);

  useEffect(() => {
    if (emails) {
      setData(emails);
    }
  }, [emails]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      let filteredData = [...data];

      // Filter by datetime
      if (datetimeFilter) {
        const filterDate = new Date(datetimeFilter);
        filteredData = filteredData.filter((row) => {
          const rowDate = new Date(row?.datetime);
          return !isNaN(rowDate) && rowDate > filterDate;
        });
      }

      // Filter by selected categories
      filteredData = filteredData.filter((row) => {
        const category = row?.state?.category;
        return category && selectedCategories.includes(category);
      });

      // Filter by search keyword
      if (searchFilter) {
        const keyword = searchFilter.toLowerCase();
        filteredData = filteredData.filter((row) => {
          return (
            row?.from?.toLowerCase()?.includes(keyword) ||
            row?.to?.[0]?.toLowerCase()?.includes(keyword) ||
            row?.subject?.toLowerCase()?.includes(keyword) ||
            row?.body?.toLowerCase()?.includes(keyword) ||
            row?.repository?.toLowerCase()?.includes(keyword)
          );
        });
      }

      setCurrentRows(filteredData);

      if (filtersChanged) {
        setCurrentPage(1);
        setFiltersChanged(false);
      }
    }
  }, [data, datetimeFilter, selectedCategories, searchFilter, filtersChanged]);

  const handleCategoryChange = (category) => {
    if (
      selectedCategories.length === 1 &&
      selectedCategories.includes(category)
    ) {
      return;
    }

    setSelectedCategories((prevCategories) => {
      if (prevCategories.includes(category)) {
        return prevCategories.filter(
          (prevCategory) => prevCategory !== category
        );
      } else {
        return [...prevCategories, category];
      }
    });
    setFiltersChanged(true);
  };

  const handleRefresh = () => {
    resetFilters();
  };

  const resetFilters = () => {
    setSelectedCategories(["Treated", "Incomplete", "Untreated"]);
    setDatetimeFilter(null);
    setSearchFilter("");
    setFiltersChanged(true);
  };

  const handleCheckboxChange = (id) => {
    dispatch(validateEmailAsync(id));
  };

  const handleIntentions = (row) => {
    if (currentID && currentID == row._id) {
      setCurrentID(null);
      setIntentions(null);
      setContent(null);
    } else {
      setCurrentID(row._id);
      setIntentions(row.intentions);
      setContent(row);
    }
  };

  const handleQuit = () => {
    setCurrentID(null);
    setIntentions(null);
    setContent(null);
  };

  const handleContent = () => {
    if (showContent) {
      setShowContent(false);
    } else {
      setShowContent(true);
    }
  };

  const handleDownload = (filename, payload) => {
    const params = { filename: filename, payload: payload };
    dispatch(downloadFileAsync(params));
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDatetimeChange = (event) => {
    setDatetimeFilter(event.target.value);
    setFiltersChanged(true);
  };

  const handleSearchChange = (event) => {
    setSearchFilter(event.target.value);
    setFiltersChanged(true);
  };

  const pieData = [
    { category: "Treated", count: treated },
    { category: "Incomplete", count: incomplete },
    { category: "Untreated", count: untreated },
  ];

  const filteredPieData = pieData.filter((item) => item.count > 0);

  const labels = filteredPieData.map((item) => item.category);
  const series = filteredPieData.map((item) => item.count);

  const pie = {
    labels: labels,
    series: series,
  };

  const bar = {
    labels: ["Predicted", "Untreated"],
    series: barSeries,
  };

  return (
    <div className="container">
      <div className="row mb-4 d-flex align-items-center justify-content-around border px-2 py-2 rounded">
        <div className="col-md-1 my-2">
          <button
            className="btn btn-secondary py-1 px-2 mr-2"
            onClick={handleRefresh}
          >
            <i className="fas fa-filter"></i>
          </button>
        </div>

        <div className="col-md-4 my-2">
          <input
            className="form-control"
            type="datetime-local"
            onChange={handleDatetimeChange}
            value={datetimeFilter || ""}
          />
        </div>

        <div className="col-md-3 d-flex align-items-center justify-content-center my-2">
          <button
            className={`btn py-1 px-2 mr-2 ${
              selectedCategories.includes("Treated")
                ? "btn-success btn-fill"
                : "btn-success"
            }`}
            onClick={() => handleCategoryChange("Treated")}
          >
            <FaCheck />
          </button>
          <button
            className={`btn py-1 px-2 mr-2 ${
              selectedCategories.includes("Incomplete")
                ? "btn-warning btn-fill"
                : "btn-warning"
            }`}
            onClick={() => handleCategoryChange("Incomplete")}
          >
            <FaEdit />
          </button>
          <button
            className={`btn py-1 px-2 ${
              selectedCategories.includes("Untreated")
                ? "btn-danger btn-fill"
                : "btn-danger"
            }`}
            onClick={() => handleCategoryChange("Untreated")}
          >
            <FaEye />
          </button>
        </div>

        <form className="form col-md-4 d-flex align-items-center justify-content-center my-2">
          <input
            className="form-control"
            type="search"
            placeholder="Search"
            aria-label="Search"
            onChange={handleSearchChange}
            value={searchFilter}
          />
        </form>
      </div>

      <div className="row">
        <div className="table-responsive">
          <table className="table table-hover table-full-width">
            <thead>
              <tr>
                <th>V/I</th>
                <th>Datetime</th>
                <th>Mailbox</th>
                <th>Sender</th>
                <th>Repository</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {currentRows
                ?.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
                .slice(
                  (currentPage - 1) * rowsPerPage,
                  currentPage * rowsPerPage
                )
                .map((row, index) => (
                  <tr
                    key={index}
                    className={
                      currentID && currentID === row._id ? "table-active" : ""
                    }
                  >
                    <td>
                      <div className="form-check my-auto p-0">
                        <label className="form-check-label">
                          <input
                            name="state"
                            type="checkbox"
                            className="form-check-input"
                            checked={row.validate}
                            onChange={() => handleCheckboxChange(row._id)}
                          />
                          <span className="form-check-sign"></span>
                        </label>
                      </div>
                    </td>
                    <td className="text-secondary">{row.datetime}</td>
                    <td>
                      {row.to?.[0].split(searchFilter).map((part, index) => (
                        <span key={index}>
                          {index > 0 && (
                            <span className="text-danger">{searchFilter}</span>
                          )}
                          {part}
                        </span>
                      ))}
                    </td>
                    <td>
                      {row.from.split(searchFilter).map((part, index) => (
                        <span key={index}>
                          {index > 0 && (
                            <span className="text-danger">{searchFilter}</span>
                          )}
                          {part}
                        </span>
                      ))}
                    </td>
                    <td>
                      {row.repository.split(searchFilter).map((part, index) => (
                        <span key={index}>
                          {index > 0 && (
                            <span className="text-danger">{searchFilter}</span>
                          )}
                          {part}
                        </span>
                      ))}
                    </td>

                    <td>
                      <button
                        className={`btn btn-${row.state.type} border-0 p-0`}
                        onClick={() => handleIntentions(row)}
                      >
                        {row.state.category}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {currentRows?.length > rowsPerPage && (
            <nav aria-label="Table pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 && "disabled"}`}>
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage - 1)}
                    tabIndex="-1"
                    aria-disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from(
                  { length: Math.ceil(currentRows.length / rowsPerPage) },
                  (_, i) => (
                    <li
                      key={i}
                      className={`page-item ${
                        currentPage === i + 1 && "active"
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => paginate(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  )
                )}
                <li
                  className={`page-item ${
                    currentPage ===
                      Math.ceil(currentRows.length / rowsPerPage) && "disabled"
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={
                      currentPage ===
                      Math.ceil(currentRows.length / rowsPerPage)
                    }
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {intentions && (
        <div className="card my-3">
          {intentions.map((intention) => (
            <div className="container">
              <div className="card-header">
                <h4 className="text-primary mx-0 my-2">
                  {intention.action.value}{" "}
                  <span className="text-secondary" style={{ fontSize: 18 }}>
                    - {intention.action.score}
                  </span>
                </h4>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover table-full-width">
                    <thead>
                      <tr>
                        <th>Num</th>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(intention.fields).map(
                        ([key, value], index) => (
                          <tr key={index}>
                            <td>{index}</td>
                            <td>{key}</td>
                            <td>{value.value}</td>
                            <td>{value.score}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
          <div className="card-footer d-flex justify-content-end mt-2 mb-2">
            <button
              className={`btn btn-success ${showContent ? "btn-fill" : ""}`}
              onClick={handleContent}
            >
              <FaEye />
            </button>
          </div>
          <button
            className="btn btn-danger position-absolute top-0 end-0 mt-1 mr-2 border-0"
            onClick={handleQuit}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {((content && showContent) || (content && !intentions)) && (
        <div className="card my-3">
          <div className="container">
            <div className="card-header">
              <h3 className="text-primary">Subject</h3>
              <p>{content.subject}</p>
            </div>
            <div className="card-body">
              <h4 className="text-primary mt-0">Body</h4>
              <p>{content.body}</p>
            </div>
            {content.attachments.length > 0 && (
              <div className="card-footer mb-3">
                <h4 className="text-primary mt-0 mb-2">Attachments</h4>
                {content.attachments.map((attachment) => (
                  <div className="d-flex align-items-center">
                    <i className="fas fa-file text-secondary"></i>
                    <a
                      className="btn border-0 text-decoration-none text-secondary"
                      onClick={() =>
                        handleDownload(attachment.filename, attachment.payload)
                      }
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "97%",
                      }}
                    >
                      {attachment.filename}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
          {!intentions && (
            <button
              className="btn btn-danger position-absolute top-0 end-0 mt-1 mr-2 border-0"
              onClick={handleQuit}
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}

      {data?.length > 0 && (
        <div className="row">
          <div className="col-md-6 mt-4">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Emails Statistics</h4>
                <p className="card-category">Categories</p>
              </div>
              <div className="card-body">
                <div className="ct-chart">
                  <ChartistGraph
                    type="Pie"
                    data={pie}
                    options={pieChartOptions}
                    listener={pieChartEventHandlers}
                  />
                </div>
              </div>
              <div className="card-footer">
                <div className="stats">
                  <i className="far fa-chart-bar"></i> emails count :{" "}
                  <b>{data?.length}</b>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 mt-4">
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Confusion Matrix</h4>
                <p className="card-category">Predictions</p>
              </div>
              <div className="card-body">
                <div className="ct-chart">
                  <ChartistGraph
                    type="Bar"
                    data={bar}
                    options={stackedBarOptions}
                    listener={stackedBarEventHandlers}
                  />
                </div>
              </div>
              <div className="card-footer">
                <div className="stats">
                  <i className="far fa-chart-bar"></i> emails count :{" "}
                  <b>{data.length}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rna-container">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
    </div>
  );
}

export default Dashboard;
