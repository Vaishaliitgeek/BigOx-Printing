/**
 * App.jsx
 *
 * High-level flow container for the 4-step print customizer:
 * 1) Upload
 * 2) Size / Crop & Position
 * 3) Paper selection
 * 4) Finish / Summary
 */

import { useEffect, useState, useCallback } from "react";
import "./App.css";

// Data (defaults)
import { PRINT_SIZES, PAPERS } from "./pages/printData";

// API / services
import { getTemplateFromDb, getValidationRules } from "./services/services.js";

import "react-toastify/dist/ReactToastify.css";

// UI components
import Header from "./components/Header/Header";
import Upload from "./components/costomizer/upload/Upload.jsx";
import Size from "./components/costomizer/CropAndPosition/Size.jsx";
import Paper from "./components/costomizer/Paper/Paper";
import StepFinish from "./components/costomizer/finish/StepFinish.jsx";
import Lamination from "./components/costomizer/Lamination/lamination.jsx"
import Mounting from "./components/costomizer/Mounting//Mounting.jsx"
import { ToastContainer } from "react-toastify";
/**
 * Step constants make the code more readable than using raw numbers everywhere.
 */
const STEPS = {
  UPLOAD: 1,
  sizeOptions: 2,
  paperOptions: 3,
  laminationOptions: 4,
  mountingOptions: 5,
  FINISH: 6,
};

const ALLSTEPS = ["UPLOAD", "sizeOptions", "paperOptions", "laminationOptions", "mountingOptions", "FINISH",];


const MIN_STEP = STEPS.UPLOAD;
const MAX_STEP = STEPS.FINISH;

function App() {


  const [appSteps, setAppSteps] = useState(STEPS);
  // -----------------------------
  // Stepper / navigation state
  // -----------------------------
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);

  // -----------------------------
  // Product configuration state
  // -----------------------------
  const [selectedSizeId, setSelectedSizeId] = useState(PRINT_SIZES?.[0]?.id);
  const [selectedPaperId, setSelectedPaperId] = useState(PAPERS?.[0]?.id);

  // Finish-step options
  const [borderSize, setBorderSize] = useState("none");
  const [quantity, setQuantity] = useState(1);

  // -----------------------------
  // Validation rules (from API)
  // -----------------------------
  const [rules, setRules] = useState(null);
  const [template, setTemplate] = useState(null);

  // If you plan to use sizeOptions later, keep it.
  // Otherwise, remove it to reduce unused state.
  const [sizeOptions, setSizeOptions] = useState([]);
  const [isValideOptions, setIsValideOption] = useState({ "borderOption": true, "metaOptions": true });

  // Handle Order data
  const [orderConfig, setOrderConfig] = useState({
    templateName: null,
    size: null,
    paper: null,
    lamination: null,
    mounting: null,
    mat: null,
    border: null,
    quantity: 1,
  });



  function updateStepsWithValideData(template) {
    console.log("------------template", template)
    if (!template) return;
    let currentStep = 1;
    const stepMapping = {};

    ALLSTEPS.forEach((step) => {
      // Assign step count for UPLOAD and FINISH steps
      if (step === "UPLOAD" || step === "FINISH") {
        stepMapping[step] = currentStep;
        currentStep++;
        return;
      }

      // Assign step count for valid steps with non-empty arrays in the template
      if (Array.isArray(template[step]) && template[step].length > 0) {
        stepMapping[step] = currentStep;
        currentStep++;
      }
    });

    if (template["borderOptions"]) {
      setIsValideOption((prev) => ({ ...prev, "borderOption": true }));
    }
    if (template["metaOptions"]) {
      setIsValideOption((prev) => ({ ...prev, "metaOptions": true }));
    }
    setAppSteps(stepMapping);
  }


  /**
   * Loads validation rules from the backend once on mount.
   * Wrapped in useCallback so it has stable identity and keeps lint happy.
   */
  const loadRules = useCallback(async () => {
    try {
      const fetchedRules = await getValidationRules();
      setRules(fetchedRules);
      console.log("Validation rules:", fetchedRules);
    } catch (error) {
      console.error("Failed to load validation rules:", error);
      setRules(null); // safe fallback
    }
  }, []);

  const loadTemplates = useCallback(async () => {

    try {
      const fetchTemplate = await getTemplateFromDb();
      // const currentTemplate = fetchTemplate[2];
      setTemplate(fetchTemplate);
      // updateStepsWithValsetOrderConfig()
      setOrderConfig((prev) => ({ ...prev, templateName: fetchTemplate?.templateName }));
      console.log("fetchTemplate :", fetchTemplate);
    } catch (error) {
      console.error("Failed to load Template:", error);
      setRules(null); // safe fallback
    }
  }, [])

  useEffect(() => {
    loadRules();
    loadTemplates();
  }, [loadRules, loadTemplates]);


  console.log("----------------templatechech", template)
  // -----------------------------
  // Handlers for finish-step inputs
  // -----------------------------
  const handleBorderChange = useCallback((newBorderSize) => {
    setBorderSize(newBorderSize);
  }, []);

  const handleQuantityChange = useCallback((newQuantity) => {
    setQuantity(newQuantity);
  }, []);

  // -----------------------------
  // Navigation helpers
  // -----------------------------
  /**
   * Jump to a specific step safely.
   * Prevents going out of range.
   */
  const goToStep = useCallback((step) => {
    if (step < MIN_STEP || step > MAX_STEP) return;
    setCurrentStep(step);
  }, []);

  /**
   * Go to previous step (clamped).
   */
  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(MIN_STEP, prev - 1));
  }, []);

  /**
   * Close/reset flow.
   * You can swap this to navigate to a route if needed.
   */
  const handleClose = useCallback(() => {
    setCurrentStep(STEPS.UPLOAD);
  }, []);

  /**
   * Go to next step (clamped).
   */
  // const handleNext = useCallback(() => {
  //   setCurrentStep((prev) => Math.min(MAX_STEP, prev + 1));
  // }, []);
  const handleNext = useCallback((payload = {}) => {
    setOrderConfig((prev) => ({
      ...prev,
      ...payload,
    }));

    setCurrentStep((prev) => Math.min(MAX_STEP, prev + 1));
  }, []);
  console.log("--------rulescheck", rules)

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="Appcontainer">
      <Header
        currentStep={currentStep}
        onBack={handleBack}
        onClose={handleClose}
        appSteps={appSteps}
        onStepClick={goToStep} // enables clicking step indicators for testing only remove in future
      />

      {/* Render only the active step */}
      {currentStep === appSteps.UPLOAD && (
        <Upload
          handleNext={handleNext}
          rules={rules}
          template={template}
        />
      )}

      {currentStep === appSteps.sizeOptions && (
        <Size
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
        />
      )}

      {currentStep === appSteps.paperOptions && (
        <Paper
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
        />
      )}
      {currentStep === appSteps.laminationOptions && (
        <Lamination
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
        />
      )}
      {currentStep === appSteps.mountingOptions && (
        <Mounting
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
        />
      )}

      {currentStep === appSteps.FINISH && (
        <StepFinish
          selectedSizeId={selectedSizeId}
          selectedPaperId={selectedPaperId}
          borderSize={borderSize}
          quantity={quantity}
          onBorderChange={handleBorderChange}
          onQuantityChange={handleQuantityChange}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
          setOrderConfig={setOrderConfig}
          handleBack={handleBack}
        />
      )}

      <ToastContainer
        position="top-right"
        autoClose={8000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>
  );
}

export default App;
