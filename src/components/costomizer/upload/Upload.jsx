// export default StepUpload;
import React, { useRef, useState, useEffect } from "react";
import "./Upload.css";
import {
  PRINT_SIZES,
  calculatePPI,
  getQualityLevel,
  getQualityColor,
  getQualityInfoByPPI,
  getMaxPPI,
} from "../../../pages/printData.js";
import { FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
// import FileIcon from '../../../assets/File.jpg'
import { FaRegFileImage } from "react-icons/fa";


const DB_NAME = "image-db";
const DB_VERSION = 1;
const STORE_NAME = "images";
const CURRENT_IMAGE_KEY = "current-image";

// --- IndexedDB helpers ---

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}



async function saveCurrentImage(imageData) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put(imageData, CURRENT_IMAGE_KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadCurrentImage() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.get(CURRENT_IMAGE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function clearCurrentImage() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(CURRENT_IMAGE_KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}



// --- Component ---

const StepUpload = ({ onImageUpload, handleNext, setFirstLoad, firstLoad, rules, template, ppiThreshold, updateOrderConfig }) => {
  const fileInputRef = useRef(null);
  const [imageData, setImageData] = useState(null); // { url, width, height, size, ... }
  const [allowedTypes, setAllowedTypes] = useState('JPG ,JPEG,PNG, TIFF');
  const [uploadError, setUploadError] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [recommendedPPI, setRecommendedPPI] = useState(0);

  const Sizes = template?.sizeOptions;

  // Load agreement status from sessionStorage on mount (only once)
  useEffect(() => {
    const storedAgreement = sessionStorage.getItem("hasAgreed");
    if (storedAgreement === "true") {
      setIsChecked(true);
    }
  }, []);


  // Load image from IndexedDB only if firstLoad is true (prevent loading on subsequent renders)
  useEffect(() => {
    const loadImage = async () => {
      try {
        const saved = await loadCurrentImage();
        if (saved) {
          setImageData(saved); // Only update if image exists in IndexedDB
          onImageUpload?.(saved.url, saved.width, saved.height);
        }
      } catch (err) {
        console.error("Error loading image from IndexedDB:", err);
      }
    };

    if (firstLoad) {
      loadImage();
    }
  }, [onImageUpload, firstLoad]);

  const handleFileSelect = (e) => {
    setFirstLoad(true); // Set first load to true, to allow loading the new image
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const validation = validateImageFile(
          file,
          img.width,
          img.height,
          rules
        );

        if (!validation.valid) {
          toast.warning(validation.message, {
            toastId: "image-upload-warning", // prevents duplicate toasts
          });
          e.target.value = ""; // reset file input
          return;
        }

        const url = event.target.result;
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);

        const imageObj = {
          url,
          width: img.width,
          height: img.height,
          size: `${sizeInMB} MB`,
          name: file.name,
          type: file.type,
          lastModified: file.lastModified,
          isSample: false,
        };

        // Clear previous image from IndexedDB
        try {
          await clearCurrentImage();
          await saveCurrentImage(imageObj); // Save the new image to IndexedDB
          // After saveCurrentImage(...)
          updateOrderConfig({
            crop: null,
            cropPixels: null,
            croppedPpi: null,
            originalPpi: null,
            rotation: false,           // optional
          });
        } catch (err) {
          console.error("Error saving image to IndexedDB:", err);
        }

        setImageData(imageObj);
        onImageUpload?.(url, img.width, img.height);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleChangeImage = async () => {
    setImageData(null);
    onImageUpload?.("", 0, 0);
    try {
      await clearCurrentImage(); // Clear the image from IndexedDB when removing it
    } catch (err) {
      console.error("Error clearing image from IndexedDB:", err);
    }
  };

  function getAllowedTypes() {
    if (!rules) return null;
    const typesResult = rules.fileConstraints.allowedTypes.reduce((combineRules, currentType) => {
      if (currentType.status) {
        const type = currentType.imageType.split("/")[1];
        return combineRules + "." + String(type).toUpperCase() + "," + " ";
      }
      else return combineRules;
    }, "");
    // console.log("typesResult", typesResult)
    return typesResult;
  }


  // Image validate from rules admin api
  function validateImageFile(file, imgWidth, imgHeight, rules) {
    if (!rules?.fileConstraints) {
      return { valid: true };
    }

    const { maxFileSizeMB, minPixelDimension, allowedTypes } =
      rules.fileConstraints;

    // 1️⃣ File size validation
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      return {
        valid: false,
        message: `File size exceeds ${maxFileSizeMB} MB`,
      };
    }

    // // 2️⃣ File type validation
    // const isTypeAllowed = allowedTypes.some(
    //   (type) => type.status && type.imageType === file.type
    // );

    // if (!isTypeAllowed) {
    //   return {
    //     valid: false,
    //     message: "Unsupported file type",
    //   };
    // }

    // 3️⃣ Minimum pixel dimension validation
    if (
      imgWidth < minPixelDimension.width ||
      imgHeight < minPixelDimension.height
    ) {
      return {
        valid: false,
        message: `Image resolution too low. Minimum required: ${minPixelDimension.width} × ${minPixelDimension.height}px`,
      };
    }

    return { valid: true };
  }

  useEffect(() => {
    setAllowedTypes(getAllowedTypes());
  }, [rules])

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);

    // Save to sessionStorage
    if (newCheckedState) {
      sessionStorage.setItem("hasAgreed", "true");
    } else {
      sessionStorage.removeItem("hasAgreed");
    }
  };

  useEffect(() => {
    const maxPPI = getMaxPPI(rules?.ppiBandColors);
    setRecommendedPPI(maxPPI);
  }, [rules]);

  // useEffect(() => {
  //   // Disable file input if checkbox is unchecked initially
  //   if (!isChecked) {
  //     fileInputRef.current.disabled = true;
  //   }
  // }, [isChecked]);
  return (
    <div className="step-upload">
      {/* Agreement checkbox */}
      {!imageData && (
        <div className="trademark-container">
          <label htmlFor="trademark-check" className="bg-trade">
            <input
              type="checkbox"
              checked={isChecked}
              id="trademark-check"
              name="trademark-check"
              required
              onChange={handleCheckboxChange}
              className="checkbox-input"
            />
            <p className="trademark-check-para">
              {rules?.checkboxMessage || "I confirm that I own the rights to this content or have obtained permission to upload, print, and reproduce it."}
            </p>
          </label>
        </div>
      )}

      {/* Upload Section */}
      <div className={`step-upload-header ${!isChecked ? "disabled" : ""}`}>
        <h2 className="step-upload-title">Upload Your Image</h2>
        <p className="">
          {allowedTypes} up to {rules?.fileConstraints?.maxFileSizeMB} MB. We'll check the resolution for your chosen size.
        </p>
      </div>

      {!imageData && (
        <div className={`step-upload-upload-section ${!isChecked ? "disabled" : ""}`}>
          <div className="upload-dropzone">
            <div className="upload-content">
              <div className="upload-circle-icon">
                <span className="upload-circle-icon-arrow">
                  <FiUpload />
                </span>
              </div>
              <div>
                <p className="upload-text">
                  Drag and drop your image here or <span>browse</span>
                </p>
                <p className="upload-subtext">{allowedTypes} Max {rules?.fileConstraints?.maxFileSizeMB} MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes}
              onChange={handleFileSelect}
              className="upload-input-hidden"
            />
          </div>
        </div>
      )}

      {/* Image Preview and Resolution */}
      {imageData && (
        <>
          <div className="step-upload-result-section">
            <div className="upload-file-bar">
              <div className="upload-file-left">
                <div className="upload-file-icon">
                  <FaRegFileImage />
                </div>
                <div className="upload-file-text">
                  <p className="upload-file-name">{imageData.name}</p>
                  <p className="upload-file-meta">
                    {imageData.width} × {imageData.height} px · {imageData.size}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="upload-file-close"
                onClick={handleChangeImage}
                aria-label="Remove image"
              >
                <FiX />
              </button>
            </div>

            <div className="upload-success-preview">
              <img src={imageData.url} alt="Uploaded" className="upload-success-img" />
            </div>

            {/* Resolution Estimate */}
            <div className="resolution-section">
              <h3 className="resolution-title">Estimated resolution at common sizes:</h3>
              {ppiThreshold && (
                <div className="resolution-grid">
                  {Sizes?.slice(0, 4).map((size) => {
                    const { PPI: ppi } = calculatePPI(
                      imageData.width,
                      imageData.height,
                      size.width,
                      size.height,
                      ppiThreshold,
                      null
                    );
                    const quality = getQualityInfoByPPI(ppi, rules?.ppiBandColors);
                    const color = quality?.color;
                    const textClass = `quality-text`;

                    return (
                      <div key={size.id} className="resolution-card">
                        <p className="resolution-card-size">{size.label}</p>
                        <p className={textClass} style={{ color }}>
                          {Math.round(ppi)}PPI
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="resolution-note">
                <p>
                  <span className="resolution-note-strong">We recommend ≥{recommendedPPI} PPI</span> for best print quality.
                </p>
              </div>
            </div>
          </div>

          <div className="step-upload-footer">
            <button
              type="button"
              className="btn-continue"
              disabled={!imageData}
              onClick={() => handleNext()}
            >
              CONTINUE TO SIZE &amp; CROP
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StepUpload;


