import React from "react";
import { BORDER_OPTIONS, PAPERS, PRINT_SIZES } from "./printData.js";
import "./StepFinish.css";

const StepFinish = ({
  imageUrl,
  selectedSizeId,
  selectedPaperId,
  borderSize,
  quantity,
  onBorderChange,
  onQuantityChange,
}) => {
  const selectedSize = PRINT_SIZES.find((s) => s.id === selectedSizeId);
  const selectedPaper = PAPERS.find((p) => p.id === selectedPaperId);

  const basePrice = selectedSize ? selectedSize.basePrice : 0;
  const paperPrice = selectedPaper ? selectedPaper.priceAdjustment : 0;
  const unitPrice = basePrice + paperPrice;
  const totalPrice = unitPrice * quantity;

  const selectedBorder = BORDER_OPTIONS.find((b) => b.id === borderSize);

  return (
    <div className="step-finish-layout">
      {/* LEFT – preview area */}
      <div className="step-finish-left">
        <div className="step-finish-header">
          <h2 className="step-finish-title">Finish Your Order</h2>
          <p className="step-finish-subtitle">Add borders and set quantity</p>
        </div>

        <div className="finish-preview-card">
          <div className="finish-preview-inner">
            <div
              className="finish-preview-frame"
              style={{
                padding: `${(selectedBorder?.value || 0) * 16}px`,
                backgroundColor:
                  selectedBorder && selectedBorder.id !== "none"
                    ? "#ffffff"
                    : "transparent",
              }}
            >
              <div className="finish-preview-aspect">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="finish-preview-img"
                  />
                ) : (
                  <div className="finish-preview-placeholder">
                    No image selected
                  </div>
                )}
              </div>
            </div>

            {selectedSize && (
              <p className="finish-preview-caption">
                {selectedSize.label} print
                {selectedBorder && selectedBorder.id !== "none"
                  ? ` with ${selectedBorder.label} white border`
                  : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT – controls */}
      <div className="step-finish-right">
        {/* Border selection */}
        <div className="finish-section">
          <h3 className="finish-section-title">Border Size</h3>
          <div className="finish-border-options">
            {BORDER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onBorderChange(option.id)}
                className={
                  "border-option-btn" +
                  (borderSize === option.id
                    ? " border-option-btn-selected"
                    : "")
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="finish-section">
          <h3 className="finish-section-title">Quantity</h3>
          <div className="quantity-box">
            <button
              type="button"
              className="qty-btn"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="qty-value">{quantity}</span>
            <button
              type="button"
              className="qty-btn"
              onClick={() => onQuantityChange(Math.min(20, quantity + 1))}
              disabled={quantity >= 20}
            >
              +
            </button>
          </div>
        </div>

        {/* Order summary */}
        <div className="order-summary-card">
          <h3 className="finish-section-title">Order Summary</h3>

          <div className="order-summary-rows">
            <div className="order-row">
              <span className="order-label">Size</span>
              <span className="order-value">
                {selectedSize ? selectedSize.label : "—"}
              </span>
            </div>
            <div className="order-row">
              <span className="order-label">Paper</span>
              <span className="order-value">
                {selectedPaper ? selectedPaper.name : "—"}
              </span>
            </div>
            <div className="order-row">
              <span className="order-label">Border</span>
              <span className="order-value">
                {selectedBorder
                  ? selectedBorder.id === "none"
                    ? "None"
                    : `${selectedBorder.label} white border`
                  : "None"}
              </span>
            </div>
            <div className="order-row">
              <span className="order-label">Quantity</span>
              <span className="order-value">{quantity}</span>
            </div>
          </div>

          <div className="order-summary-totals">
            <div className="order-row">
              <span className="order-label">Base price</span>
              <span className="order-value">${basePrice}</span>
            </div>
            {paperPrice > 0 && (
              <div className="order-row">
                <span className="order-label">Paper surcharge</span>
                <span className="order-value">+${paperPrice}</span>
              </div>
            )}
            <div className="order-row">
              <span className="order-label">Unit price</span>
              <span className="order-value">${unitPrice}</span>
            </div>
            <div className="order-row order-row-total">
              <span className="order-total-label">Total</span>
              <span className="order-total-value">${totalPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepFinish;
