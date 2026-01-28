// // import React from 'react';
// import styles from './Header.module.css'; // Import the CSS module
// import { RxCross2 } from "react-icons/rx";
// import { FaAngleLeft } from "react-icons/fa6";

// const Header = ({ currentStep = 2, onBack, onClose, onStepClick }) => {
//     const steps = [
//         { number: 1, label: 'Upload', completed: currentStep > 1 },
//         { number: 2, label: 'Size & Crop', completed: currentStep > 2 },
//         { number: 3, label: 'Paper', completed: currentStep > 3 },
//         { number: 4, label: 'Finish', completed: false },
//     ];

//     return (
//         <div className={styles.header}>
//             <div className={styles.headerContainer}>
//                 <div className={styles.headerInner}>
//                     {/* Left: Back to Product */}
//                     <button
//                         className={styles.backButton}
//                         onClick={onBack} // use handler from App
//                     >
//                         <FaAngleLeft className={styles.icon} />
//                         <span className={styles.backTextDesktop}>Back to Product</span>
//                         <span className={styles.backTextMobile}></span>
//                     </button>

//                     {/* Center: Stepper */}
//                     <div className={styles.stepper}>
//                         {steps.map((step, index) => (
//                             <React.Fragment key={step.number}>
//                                 <div className={styles.stepWrapper}>
//                                     <div className={styles.step}>
//                                         <div
//                                             className={[
//                                                 styles.stepCircle,
//                                                 step.completed ? styles.stepCircleCompleted :
//                                                     currentStep === step.number ? styles.stepCircleCurrent :
//                                                         styles.stepCircleUpcoming
//                                             ].join(' ')}
//                                             // onClick={() => {
//                                             //     if (onStepClick) onStepClick(step.number);
//                                             // }}
//                                             // style={{ cursor: onStepClick ? 'pointer' : 'default' }}
//                                         >
//                                             {step.completed ? (
//                                                 <svg
//                                                     className={styles.checkIcon}
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
//                                             className={[
//                                                 styles.stepLabel,
//                                                 currentStep >= step.number ? styles.stepLabelActive : styles.stepLabelInactive
//                                             ].join(' ')}
//                                         >
//                                             {step.label}
//                                         </span>
//                                     </div>

//                                     {/* Connector Line */}
//                                     {index < steps.length - 1 && (
//                                         <div
//                                             className={[
//                                                 styles.stepConnector,
//                                                 currentStep > step.number + 1 ? styles.stepConnectorActive : styles.stepConnectorInactive
//                                             ].join(' ')}
//                                         />
//                                     )}
//                                 </div>
//                             </React.Fragment>
//                         ))}
//                     </div>

//                     {/* Right: Close Button */}
//                     <button
//                         className={styles.closeButton}
//                         onClick={onClose} // use handler from App
//                     >
//                         <RxCross2 className={styles.iconClose} />
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Header;
