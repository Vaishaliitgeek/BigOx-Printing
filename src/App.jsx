/**
 * App.jsx
 *
 * High-level flow container for the 4-step print customizer:
 * 1) Upload
 * 2) Size / Crop & Position
 * 3) Paper selection
 * 4) Finish / Summary
 */

import { useEffect, useState, useCallback, use } from "react";
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

// import {
//   getCommerceRulesCustomerDiscounts,
//   getCommerceRulesQuantityAndDiscounts,
//   getCommerceRulesQuantityAndLimits,
// } from '../../../services/services';
import { getCommerceRulesCustomerDiscounts, getCommerceRulesQuantityAndDiscounts, getCommerceRulesQuantityAndLimits } from "./services/services.js";
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


const normalizeQuantityDiscounts = (res) => {
  // supports both shapes:
  // 1) [{ discountTiers: [...] }]
  // 2) [...]
  if (Array.isArray(res?.[0]?.discountTiers)) return res[0].discountTiers;
  if (Array.isArray(res)) return res;
  return [];
};


const ALLSTEPS = ["UPLOAD", "sizeOptions", "paperOptions", "laminationOptions", "mountingOptions", "FINISH",];


const MIN_STEP = STEPS.UPLOAD;
const MAX_STEP = STEPS.FINISH;

function App(props) {
  console.log("---props", props)

  const [appSteps, setAppSteps] = useState(STEPS);
  const [commerceRules, setCommerceRules] = useState({
    customerDiscountRules: [],
    quantityDiscountRules: [],
    quantityAndLimits: [],
  });

  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product_id');

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
  const [firstLoad, setFirstLoad] = useState(false);

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
      const fetchTemplate = await getTemplateFromDb(productId);
      // const currentTemplate = fetchTemplate[2];
      setTemplate(fetchTemplate);
      setOrderConfig((prev) => ({ ...prev, templateName: fetchTemplate?.templateName }));
      updateStepsWithValideData(fetchTemplate);
      // console.log("fetchTemplate :", fetchTemplate);
    } catch (error) {
      console.error("Failed to load Template:", error);
      setRules(null); // safe fallback
    }
  }, [])

  useEffect(() => {
    loadRules();
    loadTemplates();
    setFirstLoad(false);
  }, [loadRules, loadTemplates]);

  // -----------------------------
  // Handlers for finish-step inputs
  // -----------------------------
  const handleBorderChange = useCallback((newBorderSize) => {
    setBorderSize(newBorderSize);
  }, []);

  const handleQuantityChange = useCallback((newQuantity) => {
    setQuantity(newQuantity);
  }, []);


  // useEffect(() => {
  //   console.log("-------firstLoad", firstLoad)
  // }, [firstLoad])


  useEffect(() => {
    let alive = true;

    (async () => {
      setRulesLoading(true);
      setRulesError('');
      try {
        const [customerRes, quantityRes, limitsRes] = await Promise.all([
          getCommerceRulesCustomerDiscounts(),
          getCommerceRulesQuantityAndDiscounts(),
          getCommerceRulesQuantityAndLimits(),
        ]);

        if (!alive) return;

        setCommerceRules({
          customerDiscountRules: Array.isArray(customerRes) ? customerRes : [],
          quantityDiscountRules: normalizeQuantityDiscounts(quantityRes),
          quantityAndLimits: Array.isArray(limitsRes) ? limitsRes : [],
        });
      } catch (e) {
        if (!alive) return;
        setRulesError('Failed to load pricing rules');
      } finally {
        if (alive) setRulesLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
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
    window.scrollTo(0, 0);
    // window.history.back();
    setCurrentStep((prev) => Math.max(MIN_STEP, prev - 1));
    // navigate(-1)
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, [])

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
    window.scrollTo(0, 0);
    setOrderConfig((prev) => ({
      ...prev,
      ...payload,
    }));

    setCurrentStep((prev) => Math.min(MAX_STEP, prev + 1));
  }, []);

  console.log("=======ord", orderConfig)
  // -----------------------------
  // Render
  // -----------------------------

  useEffect(() => {
    const customerRes = getCommerceRulesCustomerDiscounts();
    const quantityRes = getCommerceRulesQuantityAndDiscounts();
  }, []);

  return (
    <div className="Appcontainer">

      {/* <h1>{props?.customerTags}</h1> */}

      <Header
        currentStep={currentStep}
        onBack={goBack}
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
          firstLoad={firstLoad}
          setFirstLoad={setFirstLoad}
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
          customerTags={props?.customerTags}
          commerceRules={commerceRules}
          rulesLoading={rulesLoading}
          rulesError={rulesError}
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
