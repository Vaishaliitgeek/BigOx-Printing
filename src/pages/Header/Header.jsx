// import React from 'react';
// // import { ChevronLeft, X } from 'lucide-react';
// import './Header.css';
// import { RxCross2 } from "react-icons/rx";
// import { FaAngleLeft } from "react-icons/fa6";

// const Header = ({ currentStep = 2 }) => {
//     const steps = [
//         { number: 1, label: 'Upload', completed: currentStep > 1 },
//         { number: 2, label: 'Size & Crop', completed: currentStep > 2 },
//         { number: 3, label: 'Paper', completed: currentStep > 3 },
//         { number: 4, label: 'Finish', completed: false },
//     ];

//     return (
//         <div className="headerrr                                                                                                                                                                                                                                                                                                                 ">
//             <div className="header-container">
//                 <div className="header-inner">
//                     {/* Left: Back to Product */}
//                     <button className="back-button">
//                         {/* <ChevronLeft className="icon icon-back" /> */}
//                         <FaAngleLeft />
//                         <span className="back-text-desktop">Back to Product</span>
//                         <span className="back-text-mobile">Back</span>
//                     </button>

//                     {/* Center: Stepper */}
//                     <div className="stepper">
//                         {steps.map((step, index) => (
//                             <React.Fragment key={step.number}>
//                                 <div className="step-wrapper">
//                                     <div className="step">
//                                         <div
//                                             className={
//                                                 'step-circle ' +
//                                                 (step.completed
//                                                     ? 'step-circle--completed'
//                                                     : currentStep === step.number
//                                                         ? 'step-circle--current'
//                                                         : 'step-circle--upcoming')
//                                             }
//                                         >
//                                             {step.completed ? (
//                                                 <svg
//                                                     className="check-icon"
//                                                     fill="none"
//                                                     stroke="currentColor"
//                                                     viewBox="0 0 24 24"
//                                                 >
//                                                     <path
//                                                         strokeLinecap="round"
//                                                         strokeLinejoin="round"
//                                                         strokeWidth={3}
//                                                         d="M5 13l4 4L19 7"
//                                                     />
//                                                 </svg>
//                                             ) : (
//                                                 step.number
//                                             )}
//                                         </div>

//                                         <span
//                                             className={
//                                                 'step-label ' +
//                                                 (currentStep >= step.number
//                                                     ? 'step-label--active'
//                                                     : 'step-label--inactive')
//                                             }
//                                         >
//                                             {step.label}
//                                         </span>
//                                     </div>

//                                     {/* Connector Line */}
//                                     {index < steps.length - 1 && (
//                                         <div
//                                             className={
//                                                 'step-connector ' +
//                                                 (currentStep > step.number + 1
//                                                     ? 'step-connector--active'
//                                                     : 'step-connector--inactive')
//                                             }
//                                         />
//                                     )}
//                                 </div>
//                             </React.Fragment>
//                         ))}
//                     </div>

//                     {/* Right: Close Button */}
//                     <button className="close-button">
//                         {/* <X className="icon icon-close" /> */}
//                         <RxCross2 />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Header;
// Header.jsx
import React from 'react';
import './Header.css';
import { RxCross2 } from "react-icons/rx";
import { FaAngleLeft } from "react-icons/fa6";

const Header = ({ currentStep = 2, onBack, onClose, onStepClick }) => {
    const steps = [
        { number: 1, label: 'Upload', completed: currentStep > 1 },
        { number: 2, label: 'Size & Crop', completed: currentStep > 2 },
        { number: 3, label: 'Paper', completed: currentStep > 3 },
        { number: 4, label: 'Finish', completed: false },
    ];

    return (
        <div className="headerrr">
            <div className="header-container">
                <div className="header-inner">
                    {/* Left: Back to Product */}
                    <button
                        className="back-button"
                        onClick={onBack} // use handler from App
                    >
                        <FaAngleLeft className="icon icon-back" />
                        <span className="back-text-desktop">Back to Product</span>
                        <span className="back-text-mobile">Back</span>
                    </button>

                    {/* Center: Stepper */}
                    <div className="stepper">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.number}>
                                <div className="step-wrapper">
                                    <div className="step">
                                        <div
                                            className={
                                                'step-circle ' +
                                                (step.completed
                                                    ? 'step-circle--completed'
                                                    : currentStep === step.number
                                                        ? 'step-circle--current'
                                                        : 'step-circle--upcoming')
                                            }
                                            onClick={() => {
                                                if (onStepClick) onStepClick(step.number);
                                            }} // optional: click circle to jump
                                            style={{ cursor: onStepClick ? 'pointer' : 'default' }}
                                        >
                                            {step.completed ? (
                                                <svg
                                                    className="check-icon"
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
                                            className={
                                                'step-label ' +
                                                (currentStep >= step.number
                                                    ? 'step-label--active'
                                                    : 'step-label--inactive')
                                            }
                                        >
                                            {step.label}
                                        </span>
                                    </div>

                                    {/* Connector Line */}
                                    {index < steps.length - 1 && (
                                        <div
                                            className={
                                                'step-connector ' +
                                                (currentStep > step.number + 1
                                                    ? 'step-connector--active'
                                                    : 'step-connector--inactive')
                                            }
                                        />
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Right: Close Button */}
                    <button
                        className="close-button"
                        onClick={onClose} // use handler from App
                    >
                        <RxCross2 className="icon icon-close" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;

