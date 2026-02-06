import React, { useEffect, useState } from 'react';
import styles from './Header.module.css'; // Import the CSS module
import { RxCross2 } from "react-icons/rx";
import { FaAngleLeft, FaArrowLeft } from "react-icons/fa6";
import StepIndicator from './StepIndicator';


const Header = ({ currentStep = 2, onBack, onClose, onStepClick, appSteps }) => {

    const allSteps = [
        { key: "UPLOAD", number: 1, label: 'Upload', completed: currentStep > 1 },
        { key: "sizeOptions", number: 2, label: 'Size & Crop', completed: currentStep > 2 },
        { key: "paperOptions", number: 3, label: 'Paper', completed: currentStep > 3 },
        { key: "laminationOptions", number: 4, label: 'Lamination', completed: currentStep > 4 },
        { key: "mountingOptions", number: 5, label: 'Mounting', completed: currentStep > 5 },
        { key: "FINISH", number: 6, label: 'Finish', completed: currentStep >= 6 },
    ];

    const isMobile = window.innerWidth <= 1024;

    const [steps, setSteps] = useState(allSteps)


    function getFilteredSteps() {
        // Initialize an array to hold the filtered steps
        const filteredSteps = [];

        // Log the current app steps for debugging purposes
        // console.log("appSteps", appSteps);

        // Loop through all steps to process each step
        allSteps.forEach((step) => {
            // Get the step count from the appSteps object using the step's key
            const stepCount = appSteps[step.key];

            // Check if the step count exists (is truthy)
            if (stepCount) {
                // Create an object for the current step with its details
                const stepObj = {
                    number: stepCount,  // Store the step number
                    label: step.label,  // Store the step label
                    completed: currentStep > stepCount,  // Mark as completed if currentStep is greater than stepCount
                };

                // Add the step object to the filtered steps array
                filteredSteps.push(stepObj);
            }
        });

        // Update the state with the filtered steps
        setSteps(filteredSteps);

        // Log the filtered steps for debugging purposes
        // console.log("filteredSteps", filteredSteps);
    }


    function getVisibleSteps(allSteps, currentStep, isMobile) {
        if (!isMobile) return allSteps; // Desktop → show all

        const currentIndex = allSteps.findIndex(
            (step) => step.number === currentStep
        );

        let start = Math.max(0, currentIndex - 1);
        let end = start + 4;

        // Adjust if overflow
        if (end > allSteps.length) {
            end = allSteps.length;
            start = Math.max(0, end - 4);
        }

        return allSteps.slice(start, end);
    }


    useEffect(() => {
        getFilteredSteps();
    }, [appSteps, currentStep])
    const visibleSteps = getVisibleSteps(steps, currentStep, isMobile);

    return (
        <div className={styles.header}>
            <div className={styles.headerContainer}>
                <div className={styles.headerInner}>
                    {/* Left: Back to Product */}
                    <button
                        className={styles.backButton}
                        onClick={onBack} // use handler from App
                    >
                        {/* <FaAngleLeft className={styles.icon} /> */}
                        <FaArrowLeft className={styles.icon} />
                        <span className={styles.backTextDesktop}>Back to Product</span>
                        <span className={styles.backTextMobile}></span>
                    </button>

                    {/* Center: Stepper */}
                    <div className={styles.stepper}>
                        {visibleSteps.map((step, index) => (
                            <React.Fragment key={step.number}>
                                <div className={styles.stepWrapper}>
                                    <div className={styles.step}>
                                        <div
                                            className={[
                                                styles.stepCircle,
                                                step.completed ? styles.stepCircleCompleted :
                                                    currentStep === step.number ? styles.stepCircleCurrent :
                                                        styles.stepCircleUpcoming
                                            ].join(' ')}
                                        // onClick={() => {
                                        //     if (onStepClick) onStepClick(step.number);
                                        // }}
                                        // style={{ cursor: onStepClick ? 'pointer' : 'default' }}
                                        >
                                            {step.completed ? (
                                                <svg
                                                    className={styles.checkIcon}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={3}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            ) : (
                                                step.number
                                            )}
                                        </div>

                                        <span
                                            className={[
                                                styles.stepLabel,
                                                currentStep >= step.number ? styles.stepLabelActive : styles.stepLabelInactive
                                            ].join(' ')}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < visibleSteps.length - 1 && (
                                        <div
                                            className={[
                                                styles.stepConnector,
                                                currentStep > step.number + 1 ? styles.stepConnectorActive : styles.stepConnectorInactive
                                            ].join(' ')}
                                        />
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                    {/* <StepIndicator  currentStep={currentStep} steps={steps}></StepIndicator> */}
                    {/* Right: Close Button */}
                    <button
                        className={styles.closeButton}
                        onClick={onClose} // use handler from App
                    >
                        <RxCross2 className={styles.iconClose} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;
