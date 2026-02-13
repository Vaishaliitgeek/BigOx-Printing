/**
 * App.jsx
 *
 * High-level flow container for the 4-step print customizer:
 * 1) Upload
 * 2) Size / Crop & Position
 * 3) Paper selection
 * 4) Finish / Summary
 */

import { useEffect, useState, useCallback, use, useRef, useMemo } from "react";
import "./App.css";

// Data (defaults)
import { PRINT_SIZES, PAPERS, setPPiThreshold, getCropDimensionsInOriginalPixels, calculatePPI, getQualityInfoByPPI } from "./pages/printData";

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
import { toast, ToastContainer } from "react-toastify";

// import {
//   getCommerceRulesCustomerDiscounts,
//   getCommerceRulesQuantityAndDiscounts,
//   getCommerceRulesQuantityAndLimits,
// } from '../../../services/services';
import { getCommerceRulesCustomerDiscounts, getCommerceRulesQuantityAndDiscounts, getCommerceRulesQuantityAndLimits } from "./services/services.js";
import { cropToBlob } from "./components/costomizer/CropAndPosition/helper.js";
import { openDb, saveCurrentImage } from "./services/indexDb.js";
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
  const [ppiThreshold, setPpiThreshold] = useState(300); // Default threshold
  // -----------------------------
  // Stepper / navigation state
  // -----------------------------
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [maxReachedStep, setMaxReachedStep] = useState(currentStep);


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
  // const [sizeOptions, setSizeOptions] = useState([]);
  const [isValideOptions, setIsValideOption] = useState({ "borderOption": true, "metaOptions": true });




  const sizeOptions = useMemo(() => {
    return (template?.sizeOptions || [])
      .filter((size) => size.status === true)
      .map((size) => ({
        ...size,
        w: size.width,
        h: size.height,
        id: size.dimensionText,
        price: size.priceDeltaMinor,
      }));
  }, [template?.sizeOptions]);

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

  const [selectedSizeId, setSelectedSizeId] = useState(orderConfig?.size?.id ?? null); // Changed to null initially

  const imgRef = useRef(null);
  const [imageData, setImageData] = useState(null); //vv
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(orderConfig?.rotation ?? false);



  useEffect(() => {
    console.log("completedCrop", completedCrop)
  }, [completedCrop])

  function updateStepsWithValideData(template) {
    // console.log("------------template", template)
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

  const STORE_NAME = "images";
  const CURRENT_IMAGE_KEY = "current-image";

  async function clearCurrentImage() {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.delete(CURRENT_IMAGE_KEY);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  // const DB_NAME = "image-db";
  // const DB_VERSION = 1;
  // const STORE_NAME = "images";
  // const CURRENT_IMAGE_KEY = "current-image";

  // function openDB() {
  //   return new Promise((resolve, reject) => {
  //     if (typeof window === "undefined" || !("indexedDB" in window)) {
  //       reject(new Error("IndexedDB not supported in this environment"));
  //       return;
  //     }

  //     const request = indexedDB.open(DB_NAME, DB_VERSION);

  //     request.onupgradeneeded = (event) => {
  //       const db = event.target.result;
  //       if (!db.objectStoreNames.contains(STORE_NAME)) {
  //         db.createObjectStore(STORE_NAME);
  //       }
  //     };

  //     request.onsuccess = () => resolve(request.result);
  //     request.onerror = () => reject(request.error);
  //   });
  // }  


  // Clear IndexedDB when the app starts or component mounts (runs only once)
  useEffect(() => {
    const clearImageDataOnAppStart = async () => {
      console.log("=========clear runing")
      try {
        await clearCurrentImage();  // Clear image when app starts
      } catch (err) {
        console.error("Error clearing image from IndexedDB:", err);
      }
    };

    clearImageDataOnAppStart();
  }, []);  // Empty dependency array means it runs once on component mount

  /**
   * Loads validation rules from the backend once on mount.
   * Wrapped in useCallback so it has stable identity and keeps lint happy.
   */
  const loadRules = useCallback(async () => {
    try {
      const fetchedRules = await getValidationRules();
      setRules(fetchedRules);
      setPpiThreshold(fetchedRules?.ppiThreshold);
      // console.log("Validation rules:", fetchedRules);
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
    // onDownload({ goNext: false, completedCrop, step });
    setCurrentStep(step);
    setMaxReachedStep((p) => Math.max(p, step));
  }, []);

  /**
   * Go to previous step (clamped).
   */
  const handleBack = useCallback(() => {
    window.scrollTo(0, 0);
    // window.history.back();
    setCurrentStep((prev) => Math.max(MIN_STEP, prev - 1));
    // navigate(-1)
    // onDownload();
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
    setMaxReachedStep(STEPS.UPLOAD);
  }, []);

  /**
   * Go to next step (clamped).
   */
  // const handleNext = useCallback(() => {
  //   setCurrentStep((prev) => Math.min(MAX_STEP, prev + 1));
  // }, []);

  // New function just for updating config
  const updateOrderConfig = useCallback((payload = {}) => {
    setOrderConfig((prev) => ({ ...prev, ...payload }));
  }, []);
  const handleNext = useCallback((payload = {}) => {
    // onDownload();
    window.scrollTo(0, 0);
    setOrderConfig((prev) => ({
      ...prev,
      ...payload,
    }));

    setCurrentStep((prev) => {
      const next = Math.min(MAX_STEP, prev + 1);
      setMaxReachedStep((p) => Math.max(p, next));   // update max
      return next;
    });
  }, []);

  // console.log("=======ord", orderConfig)
  // -----------------------------
  // Render
  // -----------------------------

  useEffect(() => {
    const customerRes = getCommerceRulesCustomerDiscounts();
    const quantityRes = getCommerceRulesQuantityAndDiscounts();
  }, []);

  const sizeAvailability = useMemo(() => {
    if (!completedCrop || !imageData) {
      return sizeOptions.map(item => ({ ...item, disabled: false, ppi: 0 }));
    }

    const { cropWpx, cropHpx } = getCropDimensionsInOriginalPixels(
      completedCrop,
      imgRef,
      imageData
    );

    return sizeOptions.map((item) => {
      const res = calculatePPI(cropWpx, cropHpx, item.w, item.h, ppiThreshold, rotation);
      const ppi = res?.PPI ?? 0;
      const disabled = ppi < ppiThreshold;
      const quality = getQualityInfoByPPI(ppi, rules?.ppiBandColors);

      return {
        ...item,
        ppi,
        disabled,
        color: quality?.color
      };
    });
  }, [completedCrop, imageData, sizeOptions, rotation, rules]);

  const selectedSize = useMemo(
    () => sizeAvailability.find((s) => s.id === selectedSizeId) ?? sizeAvailability[0],
    [selectedSizeId, sizeAvailability]
  );

  async function onDownload({ goNext = true, step }) {
    try {
      const img = imgRef.current;

      if (!img) {
        toast.error("Please upload an image first");
        return;
      }
      console.log("getting completedCrop", completedCrop);
      if (!completedCrop) {
        toast.error("Please select a crop area first");
        return;
      }

      // Check if all sizes are disabled
      const hasAvailableSize = sizeAvailability.some(s => !s.disabled);
      if (!hasAvailableSize) {
        toast.error("Please choose a high quality image. Current image resolution is too low for any print size.");
        return;
      }

      // Check if selected size is disabled
      const currentSize = sizeAvailability.find(s => s.id === selectedSizeId);
      if (currentSize?.disabled) {
        toast.error("Selected size is not available. Please choose a different size or upload a higher quality image.");
        return;
      }

      const blob = await cropToBlob(img, completedCrop, "image/png");
      console.log("blob", blob)

      const finalImageUrl = URL.createObjectURL(blob);

      const { cropWpx, cropHpx } = getCropDimensionsInOriginalPixels(
        completedCrop,
        imgRef,
        imageData
      );

      const res = calculatePPI(cropWpx, cropHpx, selectedSize.w, selectedSize.h, ppiThreshold, rotation);
      const resdata = calculatePPI(imageData?.width, imageData?.height, selectedSize.w, selectedSize.h, ppiThreshold, rotation);


      // handleNext({
      //   size: {
      //     id: selectedSize.id,
      //     label: selectedSize.id,
      //     width: selectedSize.w,
      //     height: selectedSize.h,
      //     price: selectedSize.price,
      //   },
      //   crop: completedCrop,
      //   cropPixels: { width: cropWpx, height: cropHpx },
      //   croppedPpi: res.PPI,
      //   originalPpi: resdata.PPI,
      //   croppedPpiValid: res.isValid,
      //   finalImageUrl,
      //   rotation,
      //   isCropping: isCropping,
      // });

      const ff = await saveCurrentImage({
        url: finalImageUrl,
        width: cropWpx,
        height: cropHpx,
        blob,
        type: "image/png",
      });

      console.log('ff', ff)
      if (goNext) {
        handleNext()
      }
      else {
        setCurrentStep(step);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message ?? "Failed to export crop");
    }
  }

  return (
    <div className="Appcontainer">

      {/* <h1>{props?.customerTags}</h1> */}

      <Header
        currentStep={currentStep}
        onBack={goBack}
        onClose={handleClose}
        appSteps={appSteps}
        onDownload={onDownload}
        maxReachedStep={maxReachedStep}
        setMaxReachedStep={setMaxReachedStep}
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
          ppiThreshold={ppiThreshold}
          updateOrderConfig={updateOrderConfig}
        />
      )}

      {currentStep === appSteps.sizeOptions && (
        <Size
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
          updateOrderConfig={updateOrderConfig} // NEW
          currentStep={currentStep}
          ppiThreshold={ppiThreshold}
          onDownload={onDownload}
          {...{
            imgRef, imageData, setImageData, completedCrop, setCompletedCrop, rotation, setRotation,
            sizeAvailability, selectedSize, selectedSizeId, setSelectedSizeId
          }
          }
        />
      )}

      {currentStep === appSteps.paperOptions && (
        <Paper
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
          updateOrderConfig={updateOrderConfig} // NEW
        />
      )}
      {currentStep === appSteps.laminationOptions && (
        <Lamination
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
          updateOrderConfig={updateOrderConfig} // NEW
        />
      )}
      {currentStep === appSteps.mountingOptions && (
        <Mounting
          handleBack={handleBack}
          handleNext={handleNext}
          rules={rules}
          template={template}
          orderConfig={orderConfig}
          updateOrderConfig={updateOrderConfig} // NEW
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
          updateOrderConfig={updateOrderConfig} // NEW
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
