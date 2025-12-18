// import React, { useState, useRef, useEffect } from 'react';
// // import './Size.css'
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowRotateLeft } from "react-icons/fa6";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
// import "./App.css";
import "./size.css";
// --- IndexedDB helpers (same DB as in Upload) ---
const DB_NAME = "image-db";
const DB_VERSION = 1;
const STORE_NAME = "images";
const CURRENT_IMAGE_KEY = "current-image";
const CROP_IMAGE_KEY = "crop-image";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function loadImageFromDb() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(CURRENT_IMAGE_KEY);
    console.log("IndexedDB request:", request);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function saveCurrentImage(imageData) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put(imageData, CROP_IMAGE_KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const handleUrlSelect = (imageUrl, handleNext) => {
  if (!imageUrl) return;

  const img = new Image();
  img.onload = async () => {
    const url = imageUrl;
    const sizeInMB = (img.src.length / (1024 * 1024)).toFixed(1); // Since URL will not have file size, we're using image source length for estimation

    const imageObj = {
      url,
      width: img.width,
      height: img.height,
      size: `${sizeInMB} MB`,
      name: "image-from-url", // Since this is from a URL, we won't have a filename. You can modify this as needed
      type: "image/jpeg", // Assuming it's a jpeg, you may adjust this based on the actual content type.
      lastModified: Date.now(), // Assuming this is a new image, we can set the current timestamp
      isSample: false,
    };

    // setImageData(imageObj);

    try {
      await saveCurrentImage(imageObj);
      handleNext();
    } catch (err) {
      console.error("Error saving image to IndexedDB:", err);
    }

    onImageUpload?.(url, img.width, img.height);
  };

  img.src = imageUrl; // Set the image source to the URL
};
// //   // compute PPI for a given size string
const computePpiForSize = (sizeStr, imageDimensions) => {
  const { w, h } = imageDimensions;
  if (!w || !h) return null;

  const { widthIn, heightIn } = parseSizeInches(sizeStr);
  if (!widthIn || !heightIn) return null;

  const ppiW = w / widthIn;
  const ppiH = h / heightIn;
  const ppi = Math.floor(Math.min(ppiW, ppiH));
  return ppi;
};

const getQualityFromPpi = (ppi) => {
  if (ppi == null) return "gray";
  if (ppi >= 180) return "green";
  if (ppi >= 150) return "orange";
  return "red";
};

const getQualityClass = (quality) => {
  switch (quality) {
    case "green":
      return "quality-green";
    case "orange":
      return "quality-orange";
    case "red":
      return "quality-red";
    default:
      return "quality-gray";
  }
};

const parseSizeInches = (sizeStr) => {
  if (!sizeStr) return { widthIn: null, heightIn: null };
  const cleaned = sizeStr.replace(/"/g, "").trim(); // remove "
  const [wStr, hStr] = cleaned.split(/[×x]/i); // × or x
  const widthIn = parseFloat(wStr);
  const heightIn = parseFloat(hStr);
  if (isNaN(widthIn) || isNaN(heightIn)) {
    return { widthIn: null, heightIn: null };
  }
  return { widthIn, heightIn };
};

const SIZES = [
  { id: "4×4", label: '4×4"', w: 4, h: 4, price: 799.0, minPPIThreshold: 180 },
  {
    id: "4x5",
    label: '4x5"',
    w: 4,
    h: 5,
    price: 1199.95,
    minPPIThreshold: 180,
  },
  {
    id: "4x6",
    label: '4x6"',
    w: 4,
    h: 6,
    price: 1430.71,
    minPPIThreshold: 150,
  },
  {
    id: "5x5",
    label: '5x5"',
    w: 5,
    h: 5,
    price: 1569.17,
    minPPIThreshold: 150,
  },
  { id: "5x7", label: "5x7", w: 5, h: 7, price: 1707.62, minPPIThreshold: 150 },
  { id: "6x6", label: '6x6"', w: 6, h: 6, price: 2299.0, minPPIThreshold: 150 },
  { id: "6x8", label: '6x8"', w: 6, h: 8, price: 2899.0, minPPIThreshold: 150 },
  // { id: "7x10", label: '7x10"', w: 7, h: 10, price: 2899.0, minPPIThreshold: 150 },
  // { id: "8x8", label: '8x8"', w: 8, h: 8, price: 2899.0, minPPIThreshold: 150 },
  // { id: "8x10", label: '8x10"', w: 8, h: 10, price: 2899.0, minPPIThreshold: 150 },
  // { id: "8x12", label: '8x12"', w: 8, h: 12, price: 2899.0, minPPIThreshold: 150 },
  // { id: "9x12", label: '9x12"', w: 9, h: 12, price: 2899.0, minPPIThreshold: 150 },
  // { id: "10x10", label: '10x10"', w: 10, h: 10, price: 2899.0, minPPIThreshold: 150 },
  // { id: "10x13", label: '10x13"', w: 10, h: 13, price: 2899.0, minPPIThreshold: 150 },
  // { id: "10x15", label: '10x15"', w: 10, h: 15, price: 2899.0, minPPIThreshold: 150 }
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function makeCenteredCropPx(displayW, displayH, aspect, heightPx) {
  const maxH = Math.min(displayH, displayW / aspect);
  const h = clamp(heightPx, 40, maxH);
  const w = h * aspect;

  return {
    unit: "px",
    width: w,
    height: h,
    x: (displayW - w) / 2,
    y: (displayH - h) / 2,
  };
}

async function cropToBlob(
  imageEl,
  cropPx,
  mimeType = "image/png",
  quality = 0.92
) {
  if (!cropPx?.width || !cropPx?.height)
    throw new Error("No crop area selected");

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  const scaleX = imageEl.naturalWidth / imageEl.width;
  const scaleY = imageEl.naturalHeight / imageEl.height;

  const sx = Math.round(cropPx.x * scaleX);
  const sy = Math.round(cropPx.y * scaleY);
  const sw = Math.round(cropPx.width * scaleX);
  const sh = Math.round(cropPx.height * scaleY);

  canvas.width = sw;
  canvas.height = sh;

  ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, sw, sh);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas export failed")),
      mimeType,
      quality
    );
  });
}

export default function App({ handleBack, handleNext }) {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const [imageSrc, setImageSrc] = useState("/sample.jpg"); // optional default
  const [selectedSizeId, setSelectedSizeId] = useState("10x12");
  const [rotation, setRotation] = useState(false);
  const handleRotate = () => {
    setRotation((prev) => !prev);
  };

  const selectedSize = useMemo(
    () => SIZES.find((s) => s.id === selectedSizeId) ?? SIZES[0],
    [selectedSizeId]
  );

  const aspect = rotation
    ? selectedSize.h / selectedSize.w
    : selectedSize.w / selectedSize.h;

  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);

  const [displayDims, setDisplayDims] = useState({ w: 0, h: 0 });
  const [cropHeightPx, setCropHeightPx] = useState(260);

  const heightMax = useMemo(() => {
    if (!displayDims.w || !displayDims.h) return 600;
    return Math.min(displayDims.h, displayDims.w / aspect);
  }, [displayDims, aspect]);

  // When image loads, set initial crop.
  function onImageLoad(e) {
    const img = e.currentTarget;
    imgRef.current = img;

    const w = img.width;
    const h = img.height;
    setDisplayDims({ w, h });

    const initialH = Math.min(heightMax || h, h) * 1;
    setCropHeightPx(initialH);

    const c = makeCenteredCropPx(w, h, aspect, initialH);
    setCrop(c);
  }

  // Update crop area on change
  const onCropChange = (_, percentCrop) => {
    setCrop(_);
  };

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadImageFromDb();
        if (saved && saved.url) {
          setImageSrc(saved.url);
        }
      } catch (err) {
        console.error("Error loading image from IndexedDB:", err);
      }
    })();
  }, []);

  // If aspect changes (size selected), rebuild crop centered, keep similar height.
  useEffect(() => {
    if (!displayDims.w || !displayDims.h) return;
    const h = clamp(cropHeightPx, 40, heightMax);
    setCrop(makeCenteredCropPx(displayDims.w, displayDims.h, aspect, h));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, heightMax]);

  // Slider changes crop rect size (height) while keeping aspect.
  function onCropHeightSlider(val) {
    const h = clamp(Number(val), 40, heightMax);
    setCropHeightPx(h);
    setCrop(makeCenteredCropPx(displayDims.w, displayDims.h, aspect, h));
  }

  function onPickFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop(undefined);
    setCompletedCrop(null);
  }

  async function onDownload() {
    try {
      const img = imgRef.current;
      if (!img) return alert("Upload an image first.");
      if (!completedCrop) return alert("Select a crop area first.");

      const blob = await cropToBlob(img, completedCrop, "image/png");
      const url = URL.createObjectURL(blob);
      handleUrlSelect(url, handleNext);
    } catch (err) {
      console.error(err);
      alert(err?.message ?? "Failed to export crop");
    }
  }

  return (
    <div className="page">
     

      <main className="content">
        <section className="left">
          <h2>Crop &amp; Position</h2>
          <div className="imageFrame">
            {imageSrc ? (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => {
                  console.log("onchange percentcrop:", percentCrop, _);
                  // We keep px crop in state for accurate export.
                  setCrop(_);
                  onCropChange(_, percentCrop);
                }}
                onComplete={(c) => {
                  setCompletedCrop(c);
                  if (c && c.height) {
                    setCropHeightPx(c.height);
                  }
                }}
                aspect={aspect}
                keepSelection
                ruleOfThirds={false}
                minWidth={40}
                minHeight={40}
              >
                {/* Important: use onLoad to set initial crop */}
                <img
                  src={imageSrc}
                  alt="to crop"
                  onLoad={onImageLoad}
                  className="cropImage"
                  crossOrigin="anonymous"
                  style={{
                    maxWidth: "900px",
                    maxHeight: "600px",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </ReactCrop>
            ) : (
              <div className="empty">Upload an image to start</div>
            )}
          </div>

          <div className="controlsCard">
            <div className="controlRow">
              <div className="editorControlsrapper">
                <button onClick={handleRotate} className="editorRotateBtn">
                  <FaArrowRotateLeft />
                  Rotate
                </button>
                <div className="editorZoomGroup">
                  <p htmlFor="zoom" className="zoomLabel">
                    Zoom
                  </p>
                  <input
                    type="range"
                    min={40}
                    max={Math.max(40, Math.floor(heightMax))}
                    value={Math.min(cropHeightPx, heightMax || cropHeightPx)}
                    onChange={(e) => onCropHeightSlider(e.target.value)}
                    className="range"
                    id="zoom"
                    style={{ accentColor: "#CE1312" }}
                  />
                </div>
                <button onClick={() => {}} className="editorResetBtn">
                  Reset
                </button>
              </div>
            </div>

            <div className="hint">
              Tip: drag the crop rectangle to position it. Selecting a new size
              locks the ratio.
            </div>
          </div>
        </section>

        {/* <aside className="right">
          <div className="sizesCard">
            <div className="sizesList">
              {SIZES.map((s, idx) => {
                const active = s.id === selectedSizeId;
                return (
                  <button
                    key={s.id}
                    className={`sizeRow ${idx % 2 ? "alt" : ""} ${active ? "active" : ""}`}
                    onClick={() => setSelectedSizeId(s.id)}
                  >
                    <span className={`radio ${active ? "on" : ""}`} />
                    <span className="sizeLabel">{s.label}</span>
                    <span className="price">From Rs. {s.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ctaBar">
            <div className="ctaLeft">{selectedSize.label}</div>
            <div className="ctaRight">
              <div className="ctaPrice">
                From Rs. {selectedSize.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <button className="saveBtn" onClick={onDownload}>
                Save Crop
              </button>
            </div>
          </div>
        </aside> */}
        <div className="editor-right">
          <h2 className="editor-title-right">Select Size</h2>

          {/* Size Grid */}
          <div className="editorSizeGrid">
            {SIZES.map((item) => {
              const ppi = computePpiForSize(item.id, displayDims);
              const quality = getQualityFromPpi(ppi);
              return (
                <button
                  key={item.size}
                  onClick={() => setSelectedSizeId(item.id)}
                  className={
                    "editorSizeCard " +
                    (selectedSizeId === item.id ? "editorSizeCardSelected" : "")
                  }
                >
                  <div className="editor-size-card-size">{item.id}</div>
                  <div className="editor-size-card-price">{item.price}</div>
                  <div
                    className={
                      "editor-size-card-ppi " + getQualityClass(quality)
                    }
                  >
                    {ppi ? `${ppi} PPI` : "—"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Print Quality Guide */}
          <div className="editor-guide">
            <h3 className="editor-guide-title">Print Quality Guide</h3>
            <div className="editor-guide-list">
              <div className="editor-guide-item">
                <span className="editor-guide-dot guide-dot-green"></span>
                <span className="editor-guide-text">
                  &gt;180 PPI: Excellent quality
                </span>
              </div>
              <div className="editor-guide-item">
                <span className="editor-guide-dot guide-dot-orange"></span>
                <span className="editor-guide-text">
                  150–179 PPI: Good quality
                </span>
              </div>
              <div className="editor-guide-item">
                <span className="editor-guide-dot guide-dot-red"></span>
                <span className="editor-guide-text">
                  &lt;150 PPI: May show pixelation
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="footer-bar">
            <div className="footer-inner">
              <button
                className="footer-btn footer-btn-outline"
                onClick={() => handleBack()}
              >
                Back
              </button>

              <button
                className="footer-btn footer-btn-primary"
                onClick={() => onDownload()}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
