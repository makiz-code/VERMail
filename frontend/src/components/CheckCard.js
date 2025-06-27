import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";

const CheckCard = ({ current, subject, body, options, onNext, onSkip }) => {
  const [selectedValues, setSelectedValues] = useState([]);

  const handleButtonClick = (value) => {
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];
    setSelectedValues(updatedValues);
  };

  const handleValidate = () => {
    onNext(selectedValues);
    setSelectedValues([]);
  };

  return (
    <div className="container">
      <div className="card-header">
        <span className="text-secondary">{`(${current})`}</span>
        <h3 className="text-primary">Subject</h3>
        <p>{subject}</p>
      </div>
      <div className="card-body">
        <h4 className="text-primary mt-0">Body</h4>
        <p>{body}</p>
        <div className="row p-2 mt-4 d-flex align-items-center">
          {options.map((option) => (
            <button
              className={`btn col-xl-3 col-md-4 col-sm-6 col-12 ${
                selectedValues.includes(option)
                  ? "btn-success btn-fill border-white"
                  : "btn-white text-white bg-primary border-white"
              }`}
              onClick={() => handleButtonClick(option)}
              style={{ whiteSpace: "nowrap" }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="card-footer d-flex justify-content-between align-items-end mt-2 mb-2 pr-1">
        <button
          className="btn btn-secondary p-0 border-0"
          onClick={() => onSkip()}
        >
          Skip All
        </button>
        <button className="btn btn-success" onClick={handleValidate}>
          <FaCheck />
        </button>
      </div>
    </div>
  );
};

export default CheckCard;
