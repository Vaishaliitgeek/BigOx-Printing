// export default StepUpload;
import React, { useRef, useState, useEffect } from "react";
import "./Upload.css";
import {
  PRINT_SIZES,
  calculatePPI,
  getQualityLevel,
  getQualityColor,
} from "../../../pages/printData.js";
import { FiUpload, FiX } from "react-icons/fi";

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

const StepUpload = ({ onImageUpload, handleNext, rules }) => {
  const fileInputRef = useRef(null);
  const [imageData, setImageData] = useState(null); // { url, width, height, size, ... }
  const [allowedTypes, setAllowedTypes] = useState('JPG ,PNG, TIFF');

  // Load image from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadCurrentImage();
        if (saved) {
          setImageData(saved);
          onImageUpload?.(saved.url, saved.width, saved.height);
        }
      } catch (err) {
        console.error("Error loading image from IndexedDB:", err);
      }
    })();
  }, [onImageUpload]);



  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
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

        setImageData(imageObj);

        try {
          await saveCurrentImage(imageObj);
        } catch (err) {
          console.error("Error saving image to IndexedDB:", err);
        }

        // onImageUpload?.(url, img.width, img.height);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleChangeImage = async () => {
    setImageData(null);
    onImageUpload?.("", 0, 0);
    try {
      await clearCurrentImage();
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
    console.log("typesResult", typesResult)
    return typesResult;
  }

  useEffect(() => {
    setAllowedTypes(getAllowedTypes());
  }, [rules])

  return (
    <div className="step-upload">
      <div className="step-upload-header">
        <h2 className="step-upload-title">Upload Your Image</h2>
        <p className="">
          {allowedTypes} up to {rules?.fileConstraints?.maxFileSizeMB} MB. We'll check the resolution for your
          chosen size.
        </p>
      </div>

      {/* IF NO IMAGE → SHOW UPLOADER */}
      {/* {!imageData && (
        <div className="step-upload-upload-section">
          <div
            className="upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-content">
              <div className="upload-circle-icon">
                <span className="upload-circle-icon-arrow">
                  <FiUpload />
                </span>
              </div>
              <div>
                <p className="upload-text">
                  Drag and drop your image here <span>or browse</span>
                </p>
                <p className="upload-subtext">JPG, PNG, TIFF · Max 1 GB</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.tif,.tiff"
              onChange={handleFileSelect}
              className="upload-input-hidden"
            />
          </div>
        </div>
      )} */}

      {!imageData && (
        <div className="step-upload-upload-section">
          <div className="upload-dropzone">
            <div className="upload-content">
              <div className="upload-circle-icon">
                <span className="upload-circle-icon-arrow">
                  <FiUpload />
                </span>
              </div>
              <div>
                <p className="upload-text">
                  Drag and drop your image here <span>or browse</span>
                </p>
                <p className="upload-subtext">{allowedTypes} · Max {rules?.fileConstraints?.maxFileSizeMB} MB</p>
              </div>
            </div>

            {/* File input element */}
            <input
              ref={fileInputRef}
              type="file"
              // accept=".jpg,.jpeg,.png,.tif,.tiff"
              accept={allowedTypes}
              onChange={handleFileSelect}
              className="upload-input-hidden"
            />
          </div>
        </div>

      )}



      {/* IF IMAGE → SHOW PREVIEW & RESOLUTION GRID */}
      {imageData && (
        <>
          <div className="step-upload-result-section">
            {/* File bar */}
            <div className="upload-file-bar">
              <div className="upload-file-left">
                <div className="upload-file-icon">
                  <div className="upload-file-icon-inner" />
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

            {/* Image preview */}
            <div className="upload-success-preview">
              <img
                src={imageData.url}
                alt="Uploaded"
                className="upload-success-img"
              />
            </div>

            {/* Resolution estimate */}
            <div className="resolution-section">
              <h3 className="resolution-title">
                Estimated resolution at common sizes:
              </h3>

              <div className="resolution-grid">
                {PRINT_SIZES.slice(0, 4).map((size) => {
                  const ppi = calculatePPI(
                    imageData.width,
                    imageData.height,
                    size.width,
                    size.height
                  );
                  const quality = getQualityLevel(ppi);
                  const colorKey = getQualityColor(quality); // "green" | "orange" | "red" | "gray"

                  const textClass = `quality-text quality-text-${colorKey}`;

                  return (
                    <div key={size.id} className="resolution-card">
                      <p className="resolution-card-size">{size.label}</p>
                      <p className={textClass}>{Math.round(ppi)} PPI</p>
                    </div>
                  );
                })}
              </div>


              <div className="resolution-note">
                <p>
                  <span className="resolution-note-strong">
                    We recommend ≥180 PPI
                  </span>{" "}
                  for best print quality. You'll be able to select appropriate
                  sizes in the next step.
                </p>
              </div>
            </div>
          </div>

          {/* Footer button */}
          <div className="step-upload-footer">
            <button type="button" className="btn-continue" onClick={() => handleNext()}>
              CONTINUE TO SIZE &amp; CROP
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StepUpload;
