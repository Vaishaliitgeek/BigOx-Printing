import React, { useEffect, useMemo, useState } from 'react';
import styles from './Header.module.css';
import { RxCross2 } from "react-icons/rx";
import { FaArrowLeft } from "react-icons/fa6";

const MASTER_STEPS = [
    { key: "UPLOAD", number: 1, label: "Upload" },
    { key: "sizeOptions", number: 2, label: "Size & Crop" },
    { key: "paperOptions", number: 3, label: "Paper" },
    { key: "laminationOptions", number: 4, label: "Lamination" },
    { key: "mountingOptions", number: 5, label: "Mounting" },
    { key: "FINISH", number: 6, label: "Finish" },
];

const Header = ({ currentStep = 2, onBack, onClose, onStepClick, appSteps, onDownload, setMaxReachedStep, maxReachedStep }) => {
    // Responsive (updates on resize)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);



    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /**
     * Highest step ever reached in current session of this component.
     * This is the key to "don't uncheck when previewing older steps".
     */

    useEffect(() => {
        setMaxReachedStep((prev) => Math.max(prev, currentStep));
    }, [currentStep]);

    // Build steps from appSteps mapping + maxReachedStep state
    const steps = useMemo(() => {
        const filtered = [];

        for (const step of MASTER_STEPS) {
            const raw = appSteps?.[step.key];
            const stepNumber = Number(raw);

            // Skip steps not present in appSteps
            if (!Number.isFinite(stepNumber) || stepNumber <= 0) continue;

            const isCurrent = stepNumber === currentStep;
            const isVisited = stepNumber <= maxReachedStep;

            filtered.push({
                number: stepNumber,
                label: step.label,
                isCurrent,
                isVisited,
                completed: isVisited && !isCurrent, // stays checked even if user goes back
                clickable: isVisited,               // all visited steps clickable
            });
        }

        return filtered.sort((a, b) => a.number - b.number);
    }, [appSteps, currentStep, maxReachedStep]);

    const canNavigateToStep = (stepNumber) => {
        return steps.some((s) => s.number === stepNumber && s.clickable);
    };

    const handleStepNav = (stepNumber) => {
        if (!onStepClick) return;
        if (!canNavigateToStep(stepNumber)) return;
        onStepClick(stepNumber);
    };

    function getVisibleSteps(all, current, mobile) {
        if (!mobile) return all;
        if (!all.length) return all;

        const currentIndex = all.findIndex((step) => step.number === current);

        // Fallback if current step isn't in filtered list
        if (currentIndex === -1) return all.slice(0, 4);

        let start = Math.max(0, currentIndex - 1);
        let end = start + 4;

        if (end > all.length) {
            end = all.length;
            start = Math.max(0, end - 4);
        }

        return all.slice(start, end);
    }

    const visibleSteps = getVisibleSteps(steps, currentStep, isMobile);

    return (
        <div className={styles.header}>
            <div className={styles.headerContainer}>
                <div className={styles.headerInner}>
                    {/* Left: Back to Product */}
                    <button className={styles.backButton} onClick={onBack}>
                        <FaArrowLeft className={styles.icon} />
                        <span className={styles.backTextDesktop}>Back to Product</span>
                        <span className={styles.backTextMobile}></span>
                    </button>

                    {/* Center: Stepper */}
                    <div className={styles.stepper}>
                        {visibleSteps.map((step, index) => {
                            const isClickable = step.clickable && !!onStepClick;
                            const nextStep = visibleSteps[index + 1];

                            return (
                                <React.Fragment key={step.number}>
                                    <div className={styles.stepWrapper}>
                                        <div
                                            className={`${styles.step} ${isClickable ? styles.stepClickable : styles.stepDisabled}`}
                                            onClick={() => {
                                                if (currentStep == 2 && step.number != 1) {

                                                    onDownload({ goNext: false, step: step.number })
                                                }
                                                else {
                                                    handleStepNav(step.number);

                                                }

                                            }}
                                            role={isClickable ? "button" : undefined}
                                            tabIndex={isClickable ? 0 : -1}
                                            aria-current={step.isCurrent ? "step" : undefined}
                                            onKeyDown={(e) => {
                                                if (!isClickable) return;
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleStepNav(step.number);
                                                }
                                            }}
                                        >
                                            <div
                                                className={[
                                                    styles.stepCircle,
                                                    step.completed
                                                        ? styles.stepCircleCompleted
                                                        : step.isCurrent
                                                            ? styles.stepCircleCurrent
                                                            : styles.stepCircleUpcoming,
                                                ].join(" ")}
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
                                                    step.isVisited ? styles.stepLabelActive : styles.stepLabelInactive,
                                                ].join(" ")}
                                            >
                                                {step.label}
                                            </span>
                                        </div>

                                        {index < visibleSteps.length - 1 && (
                                            <div
                                                className={[
                                                    styles.stepConnector,
                                                    // keep connector active based on max reached history (not current preview step)
                                                    nextStep && nextStep.number <= maxReachedStep
                                                        ? styles.stepConnectorActive
                                                        : styles.stepConnectorInactive,
                                                ].join(" ")}
                                            />
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Right: Close */}
                    <button className={styles.closeButton} onClick={onClose}>
                        <RxCross2 className={styles.iconClose} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;
