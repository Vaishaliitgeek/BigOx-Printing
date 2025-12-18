// import React from "react";
// import { BORDER_OPTIONS, PAPERS, PRINT_SIZES } from "./printData.js";
// import "./StepFinish.css";

// const StepFinish = ({
//   imageUrl,
//   selectedSizeId,
//   selectedPaperId,
//   borderSize,
//   quantity,
//   onBorderChange,
//   onQuantityChange,
// }) => {
//   const selectedSize = PRINT_SIZES.find((s) => s.id === selectedSizeId);
//   const selectedPaper = PAPERS.find((p) => p.id === selectedPaperId);

//   const basePrice = selectedSize ? selectedSize.basePrice : 0;
//   const paperPrice = selectedPaper ? selectedPaper.priceAdjustment : 0;
//   const unitPrice = basePrice + paperPrice;
//   const totalPrice = unitPrice * quantity;

//   const selectedBorder = BORDER_OPTIONS.find((b) => b.id === borderSize);

//   return (
//     <div className="step-finish-layout">
//       {/* LEFT – preview area */}
//       <div className="step-finish-left">
//         <div className="step-finish-header">
//           <h2 className="step-finish-title">Finish Your Order</h2>
//           <p className="step-finish-subtitle">Add borders and set quantity</p>
//         </div>

//         <div className="finish-preview-card">
//           <div className="finish-preview-inner">
//             <div
//               className="finish-preview-frame"
//               style={{
//                 padding: `${(selectedBorder?.value || 0) * 16}px`,
//                 backgroundColor:
//                   selectedBorder && selectedBorder.id !== "none"
//                     ? "#ffffff"
//                     : "transparent",
//               }}
//             >
//               <div className="finish-preview-aspect">
//                 {imageUrl ? (
//                   <img
//                     src={imageUrl}
//                     alt="Preview"
//                     className="finish-preview-img"
//                   />
//                 ) : (
//                   <div className="finish-preview-placeholder">
//                     No image selected
//                   </div>
//                 )}
//               </div>
//             </div>

//             {selectedSize && (
//               <p className="finish-preview-caption">
//                 {selectedSize.label} print
//                 {selectedBorder && selectedBorder.id !== "none"
//                   ? ` with ${selectedBorder.label} white border`
//                   : ""}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* RIGHT – controls */}
//       <div className="step-finish-right">
//         {/* Border selection */}
//         <div className="finish-section">
//           <h3 className="finish-section-title">Border Size</h3>
//           <div className="finish-border-options">
//             {BORDER_OPTIONS.map((option) => (
//               <button
//                 key={option.id}
//                 type="button"
//                 onClick={() => onBorderChange(option.id)}
//                 className={
//                   "border-option-btn" +
//                   (borderSize === option.id
//                     ? " border-option-btn-selected"
//                     : "")
//                 }
//               >
//                 {option.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Quantity */}
//         <div className="finish-section">
//           <h3 className="finish-section-title">Quantity</h3>
//           <div className="quantity-box">
//             <button
//               type="button"
//               className="qty-btn"
//               onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
//               disabled={quantity <= 1}
//             >
//               −
//             </button>
//             <span className="qty-value">{quantity}</span>
//             <button
//               type="button"
//               className="qty-btn"
//               onClick={() => onQuantityChange(Math.min(20, quantity + 1))}
//               disabled={quantity >= 20}
//             >
//               +
//             </button>
//           </div>
//         </div>

//         {/* Order summary */}
//         <div className="order-summary-card">
//           <h3 className="finish-section-title">Order Summary</h3>

//           <div className="order-summary-rows">
//             <div className="order-row">
//               <span className="order-label">Size</span>
//               <span className="order-value">
//                 {selectedSize ? selectedSize.label : "—"}
//               </span>
//             </div>
//             <div className="order-row">
//               <span className="order-label">Paper</span>
//               <span className="order-value">
//                 {selectedPaper ? selectedPaper.name : "—"}
//               </span>
//             </div>
//             <div className="order-row">
//               <span className="order-label">Border</span>
//               <span className="order-value">
//                 {selectedBorder
//                   ? selectedBorder.id === "none"
//                     ? "None"
//                     : `${selectedBorder.label} white border`
//                   : "None"}
//               </span>
//             </div>
//             <div className="order-row">
//               <span className="order-label">Quantity</span>
//               <span className="order-value">{quantity}</span>
//             </div>
//           </div>

//           <div className="order-summary-totals">
//             <div className="order-row">
//               <span className="order-label">Base price</span>
//               <span className="order-value">${basePrice}</span>
//             </div>
//             {paperPrice > 0 && (
//               <div className="order-row">
//                 <span className="order-label">Paper surcharge</span>
//                 <span className="order-value">+${paperPrice}</span>
//               </div>
//             )}
//             <div className="order-row">
//               <span className="order-label">Unit price</span>
//               <span className="order-value">${unitPrice}</span>
//             </div>
//             <div className="order-row order-row-total">
//               <span className="order-total-label">Total</span>
//               <span className="order-total-value">${totalPrice}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StepFinish;

import React, { useEffect, useState } from 'react';
import './stepFinish.css'
// import './styles.css';

const DB_NAME = 'image-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CURRENT_IMAGE_KEY = 'current-image';
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
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(CROP_IMAGE_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}
const StepFinish = () => {
  const [borderSize, setBorderSize] = useState('0');
  const [quantity, setQuantity] = useState(1);
  const [imageSrc, setImageSrc] = useState(null);
  const basePrice = 68;

  const handleQuantityChange = (value) => {
    const newQuantity = Math.max(1, Math.min(20, value));
    setQuantity(newQuantity);
  };

  const total = basePrice * quantity;

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadImageFromDb();
        if (saved && saved.url) {
          setImageSrc(saved.url);
        }
      } catch (err) {
        console.error('Error loading image from IndexedDB:', err);
      }
    })();
  }, []);

  return (
    <div className="containerr">
      <div className="preview-section">
        <h2 className="section-title">Preview</h2>
        <div className="preview-box">
          <img
            src={imageSrc ? imageSrc : "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&h=500&fit=crop"}
            alt="preview-image"
            className="preview-image"
            style={{
              padding: `${borderSize}vh`, // Applying the border dynamically
              borderRadius: '8px',
            }}
          />
          <p className="preview-label">16×20" print</p>
        </div>

        <div className="order-summary">
          <h3 className="summary-title">Order Summary</h3>
          <div className="summary-row">
            <span className="summary-label">Size</span>
            <span className="summary-value">16×20"</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Paper</span>
            <span className="summary-value">Photo Rag</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Border</span>
            <span className="summary-value">None</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Quantity</span>
            <span className="summary-value">{quantity}</span>
          </div>
          <div className="summary-row summary-total">
            <span className="summary-label">Total</span>
            <span className="summary-value">${total}</span>
          </div>
        </div>
      </div>

      <div className="config-section">
        <h2 className="section-title">Border & Quantity</h2>

        <div className="border-section">
          <h3 className="subsection-title">Border Size</h3>
          <div className="border-grid">
            <button
              className={`border-button ${borderSize === '0' ? 'active' : ''}`}
              onClick={() => setBorderSize('0')}
            >
              No Border
            </button>
            <button
              className={`border-button ${borderSize === '0.25' ? 'active' : ''}`}
              onClick={() => setBorderSize('0.25')}
            >
              ¼"
            </button>
            <button
              className={`border-button ${borderSize === '0.5' ? 'active' : ''}`}
              onClick={() => setBorderSize('0.5')}
            >
              ½"
            </button>
            <button
              className={`border-button ${borderSize === '1' ? 'active' : ''}`}
              onClick={() => setBorderSize('1')}
            >
              1"
            </button>
            <button
              className={`border-button ${borderSize === '2' ? 'active' : ''}`}
              onClick={() => setBorderSize('2')}
            >
              2"
            </button>
          </div>
          <p className="border-note">Borders are blank space added around your image, not a mat or frame.</p>
        </div>

        <div className="quantity-section">
          <h3 className="subsection-title">Quantity</h3>
          <div className="quantity-control">
            <button
              className="quantity-button"
              onClick={() => handleQuantityChange(quantity - 1)}
            >
              −
            </button>
            <input
              type="number"
              className="quantity-input"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min="1"
              max="20"
            />
            <button
              className="quantity-button"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              +
            </button>
            <span className="quantity-limit">(Max 20 per order)</span>
          </div>
        </div>

        <div className="price-breakdown">
          <h3 className="breakdown-title">Price Breakdown</h3>
          <div className="breakdown-row">
            <span className="breakdown-label">Base price (16×20")</span>
            <span className="breakdown-value">${basePrice}</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">Quantity</span>
            <span className="breakdown-value">×{quantity}</span>
          </div>
          <div className="breakdown-row breakdown-total">
            <span className="breakdown-label">Total</span>
            <span className="breakdown-value">${total}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="back-button">BACK</button>
          <button className="add-to-cart-button">
            🛒 ADD TO CART
          </button>
        </div>

        <p className="shipping-note">Free shipping on orders over $100</p>
      </div>
    </div>
  );
};
export default StepFinish;
