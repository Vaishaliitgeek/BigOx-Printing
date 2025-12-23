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
import { getValidationRules } from "./services/services.js";

// UI components
import Header from "./components/Header/Header";
import Upload from "./components/costomizer/upload/Upload.jsx";
import Size from "./components/costomizer/CropAndPosition/Size.jsx";
import Paper from "./components/costomizer/Paper/Paper";
import StepFinish from "./components/costomizer/finish/StepFinish.jsx";
import Lamination from "./components/costomizer/Lamination/lamination.jsx"
/**
 * Step constants make the code more readable than using raw numbers everywhere.
 */
const STEPS = Object.freeze({
  UPLOAD: 1,
  SIZE: 2,
  PAPER: 3,
  Lamination: 4,
  Mounting: 5,
  FINISH: 6,
});

const MIN_STEP = STEPS.UPLOAD;
const MAX_STEP = STEPS.FINISH;

function App() {
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

  // If you plan to use sizeOptions later, keep it.
  // Otherwise, remove it to reduce unused state.
  const [sizeOptions, setSizeOptions] = useState([]);

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

  useEffect(() => {
    loadRules();
  }, [loadRules]);

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
  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(MAX_STEP, prev + 1));
  }, []);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="Appcontainer">
      <Header
        currentStep={currentStep}
        onBack={handleBack}
        onClose={handleClose}
        onStepClick={goToStep} // enables clicking step indicators for testing only remove in future
      />

      {/* Render only the active step */}
      {currentStep === STEPS.UPLOAD && (
        <Upload
          handleNext={handleNext}
          rules={rules}
        />
      )}

      {currentStep === STEPS.SIZE && (
        <Size
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
        />
      )}

      {currentStep === STEPS.PAPER && (
        <Paper
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
        />
      )}
      {currentStep === STEPS.Lamination && (
        <Lamination
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
        />
      )}

      {currentStep === STEPS.FINISH && (
        <StepFinish
          selectedSizeId={selectedSizeId}
          selectedPaperId={selectedPaperId}
          borderSize={borderSize}
          quantity={quantity}
          onBorderChange={handleBorderChange}
          onQuantityChange={handleQuantityChange}
          rules={rules}
        />
      )}
    </div>
  );
}

export default App;
