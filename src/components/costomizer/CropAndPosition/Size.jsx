// import React, { useState, useRef, useEffect } from 'react';
// // import './Size.css'
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowRotateLeft } from "react-icons/fa6";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
// import "./App.css";
import "./size.css";
import { apiConnecter } from "../../../utils/ApiConnector";
import { getSizeOptions } from "../../../services/services";
import { loadImageFromDb, saveCurrentImage } from "../../../services/indexDb";
import { clamp, cropToBlob, getQualityClass, getQualityFromPpi, makeCenteredCropPx, parseSizeInches } from "./helper";


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

const SIZES = [
  { id: "4 × 4", label: 'test"', w: 4, h: 4, price: 799.0, minPPIThreshold: 180 },
  {
    id: "4 x 5",
    label: '4 x 5"',
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
];



const getAllSize = async (setSizeOptions) => {
  console.log("Fetching size options from API...");
  try {
    const data = await getSizeOptions();
    const filterdData = data.map((obj) => ({ ...obj, w: obj.width, h: obj.height, id: obj.dimensionText, price: obj.priceDeltaMinor}));
    console.log('filterdData', filterdData)
    setSizeOptions(filterdData);
  } catch (err) {
    console.error("Error while getting size options:", err.message);
  }
}

// const getValidationRules = async () => {
//   console.log("Fetching Validation Rules from API...");
//   try {
//     // const data = await getValidationRules();
//     // setSizeOptions(data);
//   } catch (err) {
//     console.error("Error while getting size options:", err.message);
//   }
// }

export default function App({ handleBack, handleNext }) {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const [imageSrc, setImageSrc] = useState("/sample.jpg"); // optional default
  const [selectedSizeId, setSelectedSizeId] = useState(SIZES[0].id);
  const [rotation, setRotation] = useState(false);
  const [sizeOptions, setSizeOptions] = useState([]);
  const handleRotate = () => {
    setRotation((prev) => !prev);
  };

  const selectedSize = useMemo(
    () => sizeOptions.find((s) => s.id === selectedSizeId) ?? SIZES[0],
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

  useEffect(() => {
    getAllSize(setSizeOptions);
  }, []);

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
                <button onClick={() => { }} className="editorResetBtn">
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
          <h2 className="editor-title-right">Select Image Size</h2>

          {/* Size Grid */}
          <div className="editorSizeGrid">
            {sizeOptions?.map((item) => {
              const ppi = computePpiForSize(item.id, displayDims);
              const quality = getQualityFromPpi(ppi);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedSizeId(item.id)}
                  className={
                    "editorSizeCard " +
                    (selectedSizeId === item.id ? "editorSizeCardSelected" : "")
                  }
                >
                  <div className="editor-size-card-size">{item.id}"</div>
                  <div className="editor-size-card-price">{`$${item.price.toFixed(2)}` ?? "N/A"}</div>
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
