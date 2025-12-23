import { FaCheck } from "react-icons/fa6";
import "./StepIndicator.css"

const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="progress-bar">
      <div className="container">
        <div className="step-container">
          {steps.map((step, index) => (
            <div key={step.number} className="step">
              <div className={`step-content ${step.number != (steps.length - 1) ? "step-content-flex":""}`}>
                <div
                  className={`circle ${
                    currentStep > step.number
                      ? "completed"
                      : currentStep === step.number
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {currentStep > step.number ? (
                    <FaCheck className="check-icon" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`step-label ${
                    currentStep >= step.number ? "active-label" : "inactive-label"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`step-line ${
                    currentStep > step.number ? "completed-line" : "inactive-line"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
