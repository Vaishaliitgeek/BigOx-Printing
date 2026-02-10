import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowRotateLeft } from "react-icons/fa6";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "react-toastify"; // Add this import
import "react-toastify/dist/ReactToastify.css"; // Add this import
import "./size.css";
import { apiConnecter } from "../../../utils/ApiConnector";
import { getSizeOptions } from "../../../services/services";
import { loadImageFromDb, saveCurrentImage } from "../../../services/indexDb";
import { clamp, cropToBlob, getQualityClass, getQualityFromPpi, makeCenteredCropPx, parseSizeInches } from "./helper";
import { calculatePPI, getCropDimensionsInOriginalPixels, getQualityInfoByPPI } from "../../../pages/printData";
import { useSearchParams } from "react-router-dom";



export default function App({ currentStep, handleBack, handleNext, template, rules, orderConfig, updateOrderConfig, ppiThreshold, onDownload, imgRef, imageData, setImageData, completedCrop, setCompletedCrop, rotation, setRotation, sizeAvailability, selectedSize, selectedSizeId, setSelectedSizeId }) {
  const fileInputRef = useRef(null);
  // const imgRef = useRef(null);
  // const [imageData, setImageData] = useState(null); //vv
  // const [completedCrop, setCompletedCrop] = useState(null);
  // const [rotation, setRotation] = useState(orderConfig?.rotation ?? false);

  const [imageSrc, setImageSrc] = useState("/sample.jpg");
  // const [selectedSizeId, setSelectedSizeId] = useState(orderConfig?.size?.id ?? null); // Changed to null initially

  const [crop, setCrop] = useState();
  const [cropCoords, setCropCoords] = useState(null);
  const [displayDims, setDisplayDims] = useState({ w: 0, h: 0 });
  const [cropHeightPx, setCropHeightPx] = useState(260);
  const [isCropping, setIsCropping] = useState(orderConfig?.isCropping ?? false);
  const debouncedSetCompletedCrop = useRef(null);
  const hasRestoredCrop = useRef(false);
  const initialZoomValue = 260; // Initial zoom value


  // Restore rotation and selected size on mount (if coming back)
  useEffect(() => {
    if (orderConfig) {
      // console.log("----orderConfig", orderConfig)
      if (orderConfig.rotation !== undefined) {
        setRotation(!!orderConfig.rotation);
      }
      if (orderConfig.size?.id) {
        setSelectedSizeId(orderConfig.size.id);
        console.log("selectedSizeId", selectedSizeId)
      }
    }
  }, [orderConfig]);




  const handleRotate = () => {
    setRotation((prev) => !prev);
  };

  // correct only ppi not update
  // const handleReset = () => {
  //   // Reset zoom to initial value
  //   if (!displayDims.w || !displayDims.h || !selectedSize) return;

  //   const newAspect = selectedSize.w / selectedSize.h;  // Normal orientation
  //   const newHeightMax = Math.min(displayDims.h, displayDims.w / newAspect);
  //   const initialH = newHeightMax;

  //   setCropHeightPx(initialH);
  //   // setCropHeightPx(initialZoomValue);

  //   // Reset crop area to initial state
  //   setCrop(makeCenteredCropPx(displayDims.w, displayDims.h, aspect, initialH));
  //   // setCompletedCrop(null); // Reset crop completion state
  // };



  const handleReset = () => {
    // Reset zoom to initial value
    if (!displayDims.w || !displayDims.h || !selectedSize) return;

    const newAspect = selectedSize.w / selectedSize.h;  // Normal orientation
    const newHeightMax = Math.min(displayDims.h, displayDims.w / newAspect);
    const initialH = newHeightMax;

    setCropHeightPx(initialH);
    setIsCropping(true);

    // Reset crop area to initial state
    const newCrop = makeCenteredCropPx(displayDims.w, displayDims.h, aspect, initialH);
    setCrop(newCrop);
    setCompletedCrop(newCrop);

    // After resetting the crop, trigger PPI recalculation
    setSelectedSizeId((prevSizeId) => {
      // Recalculate size availability and PPI after resetting
      const currentSize = sizeAvailability.find((s) => s.id === prevSizeId);
      if (currentSize?.disabled) {
        const firstAvailable = sizeAvailability.find(s => !s.disabled);
        return firstAvailable?.id ?? prevSizeId;
      }
      return prevSizeId;
    });
  };


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

  // Calculate which sizes are available based on current crop
  // const sizeAvailability = useMemo(() => {
  //   if (!completedCrop || !imageData) {
  //     return sizeOptions.map(item => ({ ...item, disabled: false, ppi: 0 }));
  //   }

  //   const { cropWpx, cropHpx } = getCropDimensionsInOriginalPixels(
  //     completedCrop,
  //     imgRef,
  //     imageData
  //   );

  //   return sizeOptions.map((item) => {
  //     const res = calculatePPI(cropWpx, cropHpx, item.w, item.h, ppiThreshold, rotation);
  //     const ppi = res?.PPI ?? 0;
  //     const disabled = ppi < 300;
  //     const quality = getQualityInfoByPPI(ppi, rules?.ppiBandColors);

  //     return {
  //       ...item,
  //       ppi,
  //       disabled,
  //       color: quality?.color
  //     };
  //   });
  // }, [completedCrop, imageData, sizeOptions, rotation, rules]);

  // Auto-select first available size
  useEffect(() => {
    if (!selectedSizeId || sizeAvailability.length === 0) {
      const firstAvailable = sizeAvailability.find(s => !s.disabled);
      if (firstAvailable) {
        setSelectedSizeId(firstAvailable.id);
      }
    }
  }, [sizeAvailability, selectedSizeId]);

  // Check if currently selected size becomes disabled after crop change
  useEffect(() => {
    if (selectedSizeId && completedCrop) {
      const currentSize = sizeAvailability.find(s => s.id === selectedSizeId);
      if (currentSize?.disabled) {
        // Find first available alternative
        const firstAvailable = sizeAvailability.find(s => !s.disabled);
        if (firstAvailable) {
          setSelectedSizeId(firstAvailable.id);
          // toast.info(`Size ${selectedSizeId} is no longer available. Switched to ${firstAvailable.id}"`);
        }
      }
    }
  }, [completedCrop, selectedSizeId, sizeAvailability]);

  // const selectedSize = useMemo(
  //   () => sizeAvailability.find((s) => s.id === selectedSizeId) ?? sizeAvailability[0],
  //   [selectedSizeId, sizeAvailability]
  // );

  const aspect = rotation
    ? selectedSize?.h / selectedSize?.w
    : selectedSize?.w / selectedSize?.h;

  const heightMax = useMemo(() => {
    if (!displayDims.w || !displayDims.h) return 600;
    return Math.min(displayDims.h, displayDims.w / aspect);
  }, [displayDims, aspect]);


  function onImageLoad(e) {
    const img = e.currentTarget;
    imgRef.current = img;
    const w = img.width;
    const h = img.height;
    setDisplayDims({ w, h });

    if (orderConfig?.crop && orderConfig.crop.width > 0 && orderConfig.crop.height > 0) {
      // Restore exact saved crop (pixel-based, matches original image)
      const savedCrop = {
        ...orderConfig.crop,
        unit: "px",
      };
      setCrop(savedCrop);
      setCompletedCrop(savedCrop);
      setCropHeightPx(savedCrop.height);
      setIsCropping(true);
      hasRestoredCrop.current = true; // ✅ Mark that we just restored
    } else {
      // First-time or no saved crop → initial centered full-fit
      const initialH = Math.min(heightMax || h, h);
      setCropHeightPx(initialH);
      const c = makeCenteredCropPx(w, h, aspect, initialH);
      setCrop(c);
      hasRestoredCrop.current = false; // ✅ No restoration happened
    }
  }

  const onCropChange = (_, percentCrop) => {
    setCrop(_);
  };

  // ✅ Updated useEffect - only skip ONCE after restoration
  useEffect(() => {
    if (!displayDims.w || !displayDims.h) return;

    // Skip only on the first aspect change after restoring
    if (hasRestoredCrop.current) {
      hasRestoredCrop.current = false; // ✅ Reset flag immediately
      return;
    }

    const h = clamp(cropHeightPx, 40, heightMax);
    const newCrop = makeCenteredCropPx(displayDims.w, displayDims.h, aspect, h);
    setCrop(newCrop);
    // setCompletedCrop(newCrop); // ✅ Also update completedCrop
  }, [aspect, heightMax]);

  // ... rest of your code remains the same ...


  // useEffect(() => {
  //   if (!displayDims.w || !displayDims.h) return;
  //   const h = clamp(cropHeightPx, 40, heightMax);
  //   setCrop(makeCenteredCropPx(displayDims.w, displayDims.h, aspect, h));
  // }, [aspect, heightMax]);

  // function onCropHeightSlider(val) {
  //   const h = clamp(Number(val), 40, heightMax);
  //   setCropHeightPx(h);
  //   setCrop(makeCenteredCropPx(displayDims.w, displayDims.h, aspect, h));
  // }

  function onCropHeightSlider(val) {
    const h = clamp(Number(val), 40, heightMax);
    setCropHeightPx(h);

    const newCrop = makeCenteredCropPx(displayDims.w, displayDims.h, aspect, h);
    setCrop(newCrop);

    clearTimeout(debouncedSetCompletedCrop.current);
    debouncedSetCompletedCrop.current = setTimeout(() => {
      setCompletedCrop(newCrop);
    }, 60);
  }

  // async function onDownload() {
  //   try {
  //     const img = imgRef.current;

  //     if (!img) {
  //       // toast.error("Please upload an image first");
  //       return;
  //     }

  //     if (!completedCrop) {
  //       toast.error("Please select a crop area first");
  //       return;
  //     }

  //     // Check if all sizes are disabled
  //     const hasAvailableSize = sizeAvailability.some(s => !s.disabled);
  //     if (!hasAvailableSize) {
  //       toast.error("Please choose a high quality image. Current image resolution is too low for any print size.");
  //       return;
  //     }

  //     // Check if selected size is disabled
  //     const currentSize = sizeAvailability.find(s => s.id === selectedSizeId);
  //     if (currentSize?.disabled) {
  //       toast.error("Selected size is not available. Please choose a different size or upload a higher quality image.");
  //       return;
  //     }

  //     const blob = await cropToBlob(img, completedCrop, "image/png");
  //     const finalImageUrl = URL.createObjectURL(blob);

  //     const { cropWpx, cropHpx } = getCropDimensionsInOriginalPixels(
  //       completedCrop,
  //       imgRef,
  //       imageData
  //     );

  //     const res = calculatePPI(cropWpx, cropHpx, selectedSize.w, selectedSize.h, ppiThreshold, rotation);
  //     const resdata = calculatePPI(imageData?.width, imageData?.height, selectedSize.w, selectedSize.h, ppiThreshold, rotation);
  //     handleNext()
  //     // handleNext({
  //     //   size: {
  //     //     id: selectedSize.id,
  //     //     label: selectedSize.id,
  //     //     width: selectedSize.w,
  //     //     height: selectedSize.h,
  //     //     price: selectedSize.price,
  //     //   },
  //     //   crop: completedCrop,
  //     //   cropPixels: { width: cropWpx, height: cropHpx },
  //     //   croppedPpi: res.PPI,
  //     //   originalPpi: resdata.PPI,
  //     //   croppedPpiValid: res.isValid,
  //     //   finalImageUrl,
  //     //   rotation,
  //     //   isCropping: isCropping,
  //     // });

  //     await saveCurrentImage({
  //       url: finalImageUrl,
  //       width: cropWpx,
  //       height: cropHpx,
  //       blob,
  //       type: "image/png",
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     toast.error(err?.message ?? "Failed to export crop");
  //   }
  // }

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadImageFromDb();
        setImageData(saved);
        if (saved && saved.url) {
          setImageSrc(saved.url);
        }
      } catch (err) {
        console.error("Error loading image from IndexedDB:", err);
      }
    })();

  }, []);

  // ✅ AUTO-UPDATE: Only update when completedCrop is actually ready
  useEffect(() => {
    if (!selectedSize || !completedCrop || !imageData) return;
    // onDownload();
    // Add a small delay to ensure completedCrop has fully updated
    const timeoutId = setTimeout(() => {
      const { cropWpx, cropHpx } = getCropDimensionsInOriginalPixels(
        completedCrop,
        imgRef,
        imageData
      );

      const res = calculatePPI(cropWpx, cropHpx, selectedSize.w, selectedSize.h, ppiThreshold, rotation);
      const resdata = calculatePPI(imageData?.width, imageData?.height, selectedSize.w, selectedSize.h, ppiThreshold, rotation);

      updateOrderConfig({
        size: {
          id: selectedSize.id,
          label: selectedSize.id,
          width: selectedSize.w,
          height: selectedSize.h,
          price: selectedSize.price,
        },
        crop: completedCrop,
        cropPixels: { width: cropWpx, height: cropHpx },
        croppedPpi: res.PPI,
        originalPpi: resdata.PPI,
        croppedPpiValid: res.isValid,
        rotation,
        isCropping: isCropping,
      });
    }, 100); // Small delay to ensure crop has completed

    return () => clearTimeout(timeoutId);
  }, [selectedSize, completedCrop, rotation, isCropping, imageData, updateOrderConfig, currentStep]);


  useEffect(() => {
    // onDownload();
  }, [currentStep])
  return (
    <div className="page">
      <main className="content-paper">
        <section className="left">
          <h2>Crop &amp; Position</h2>
          <div className="imageFrame">
            {/* 
            {(!isCropping || !selectedSizeId) && (
              <div className="inlineHint">
                <span className="inlineHintIcon">ⓘ</span>
                Adjust the image Frame to continue
              </div>
            )} */}



            {imageSrc ? (
              <>
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => {
                    setCrop(_);
                    setCropCoords(_);
                    onCropChange(_, percentCrop);
                    setIsCropping(true);
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
                  {/* {!isCropping && (
                    <div className="imageOverlay">
                      <p>Adjust image before continue</p>
                    </div>
                  )} */}
                  <img
                    src={imageSrc}
                    alt="to crop"
                    onLoad={onImageLoad}
                    className="cropImage"
                    crossOrigin="anonymous"
                    style={{
                      maxWidth: "900px",
                      maxHeight: "500px",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </ReactCrop>
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
                          style={{ accentColor: "#CE1312", cursor: 'pointer' }}
                        />
                      </div>
                      <button onClick={handleReset} className="editorResetBtn">
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* <div className="hint">
                    Tip: drag the crop rectangle to position it. Selecting a new size
                    locks the ratio.
                  </div> */}
                </div>
              </>
            ) : (
              <div className="empty">Upload an image to start</div>
            )}
          </div>
        </section>

        <div className="editor-right">
          <h2 className="editor-title-right">Select Image Size</h2>

          {/* Size Grid */}
          <div className="editorSizeGrid">
            {[...sizeAvailability]
              .sort((a, b) => Number(a.disabled) - Number(b.disabled))
              .map(({ id, w, h, price, ppi, disabled, color }) => {
                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (disabled) {
                        toast.warning("This size requires a higher quality image (minimum 150 PPI)");
                        return;
                      }
                      setSelectedSizeId(id);
                    }}
                    className={
                      "editorSizeCard " +
                      (selectedSizeId === id && !disabled ? "editorSizeCardSelected" : "") +
                      (disabled ? " editorSizeCardDisabled" : "")
                    }
                    title={disabled ? "Minimum 150 PPI required for this size" : ""}
                  >
                    <div className="editor-size-card-size">{id}"</div>
                    <div className="editor-size-card-price">{`$${price.toFixed(2)}` ?? "N/A"}</div>
                    <div
                      className="editor-size-card-ppi"
                      style={{ color }}
                    >
                      {ppi ? `${ppi} PPI` : "—"}
                    </div>
                    {disabled && <div className="editor-size-card-warning">Not available</div>}
                  </button>
                );
              })}
          </div>

          {/* Print Quality Guide */}
          <div className="editor-guide">
            <h4 className="editor-guide-title">Print Quality Guide</h4>
            <div className="editor-guide-list">
              {rules?.ppiBandColors?.map((band, index) => (
                <div key={index} className="editor-guide-item">
                  <span
                    className="editor-guide-dot"
                    style={{
                      backgroundColor: band?.color, // Apply the background color based on the quality
                      borderRadius: "50%", // Ensure the dot is round
                      width: "16px", // Set size of the dot
                      height: "16px", // Set size of the dot
                      marginRight: "8px", // Space between the dot and text
                      display: "inline-block", // Ensure the dot is inline with the text
                    }}
                  ></span>
                  <span className="editor-guide-text">
                    ≥{band?.minPPI} PPI: {band?.qualityLabel} quality
                  </span>
                </div>
              ))}
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
                onClick={() => onDownload({ completedCrop })}
                // disabled={!isCropping || !selectedSizeId}
                disabled={!selectedSizeId}

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