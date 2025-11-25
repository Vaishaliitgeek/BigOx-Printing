import React, { useRef, useState } from "react";
// keep your existing helpers:
import './Upload.css';
import { PRINT_SIZES, calculatePPI, getQualityLevel, getQualityColor } from "./printData.js";

const StepUpload = ({ onImageUpload, selectedImage }) => {
  const fileInputRef = useRef(null);
  const [imageData, setImageData] = useState(null); // { url, width, height, size }

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const url = event.target.result;
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        setImageData({
          url,
          width: img.width,
          height: img.height,
          size: `${sizeInMB} MB`,
        });
        onImageUpload(url, img.width, img.height);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUseSample = () => {
    const sampleUrl =
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600&q=80";
    const img = new Image();
    img.onload = () => {
      setImageData({
        url: sampleUrl,
        width: 5472,
        height: 3648,
        size: "4.2 MB",
      });
      onImageUpload(sampleUrl, 5472, 3648);
    };
    img.src = sampleUrl;
  };

  const handleChangeImage = () => {
    setImageData(null);
    onImageUpload("", 0, 0);
  };

  return (
    <div className="step-upload">
      <div className="step-upload-header">
        <h2 className="step-upload-title">Upload Your Image</h2>
        <p className="step-upload-subtitle">
          JPG, PNG, or TIFF up to 1 GB. We'll check the resolution for your
          chosen size.
        </p>
      </div>

      {/* IF NO IMAGE → SHOW UPLOADER */}
      {!imageData && (
        <div className="step-upload-upload-section">
          <div
            className="upload-dropzone"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <div className="upload-content">
              <div className="upload-circle-icon">
                <span className="upload-circle-icon-arrow">↑</span>
              </div>
              <div>
                <p className="upload-text">
                  Drag and drop your image here
                </p>
                <p className="upload-subtext">or browse</p>
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

          <div className="step-upload-sample">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleUseSample}
            >
              Use Sample Image
            </button>
          </div>
        </div>
      )}

      {/* IF IMAGE → SHOW PREVIEW & RESOLUTION GRID */}
      {imageData && (
        <div className="step-upload-result-section">
          {/* success card */}
          <div className="upload-success-card">
            <div className="upload-success-header">
              <div className="upload-success-icon">
                <span>🖼</span>
              </div>
              <div className="upload-success-text">
                <p className="upload-success-title">
                  Image uploaded successfully
                </p>
                <p className="upload-success-meta">
                  {imageData.width} × {imageData.height} px · {imageData.size}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleChangeImage}
              >
                Change
              </button>
            </div>

            <div className="upload-success-preview">
              <img
                src={imageData.url}
                alt="Uploaded"
                className="upload-success-img"
              />
            </div>
          </div>

          {/* Resolution estimate */}
          <div className="resolution-section">
            <h3 className="resolution-title">
              Estimated resolution at common sizes
            </h3>

            <div className="resolution-grid">
              {PRINT_SIZES.map((size) => {
                const ppi = calculatePPI(
                  imageData.width,
                  imageData.height,
                  size.width,
                  size.height
                );
                const quality = getQualityLevel(ppi);
                const colorKey = getQualityColor(quality); // e.g. "green" | "orange" | "red" | "gray"

                const dotClass = `quality-dot quality-dot-${colorKey}`;
                const textClass = `quality-text quality-text-${colorKey}`;

                return (
                  <div key={size.id} className="resolution-card">
                    <div className="resolution-card-header">
                      <p className="resolution-card-size">{size.label}</p>
                      <span className={dotClass} />
                    </div>
                    <p className="resolution-card-price">${size.basePrice}</p>
                    <p className={textClass}>
                      {Math.round(ppi)} PPI
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="resolution-note">
              <p>
                <span className="resolution-note-strong">Recommendation:</span>{" "}
                We recommend ≥180 PPI for best print quality. You'll be able to
                select appropriate sizes in the next step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepUpload;
