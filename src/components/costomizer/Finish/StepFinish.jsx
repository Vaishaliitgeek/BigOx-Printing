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
import { getCommerceRulesQuantityAndLimits } from '../../../services/services';
// import './styles.css';

const DB_NAME = 'image-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CURRENT_IMAGE_KEY = 'current-image';
const CROP_IMAGE_KEY = "crop-image";

// const Mats = [
//   {
//     "_id": "694936889ed118756432e192",
//     "optionName": "No Mat",
//     "shortDescription": "Print only, no matting",
//     "__v": 0
//   },
//   {
//     "_id": "69494ddc522251b1eb2eac99",
//     "optionName": "Single White Mat",
//     "priceDeltaMinor": 23,
//     "matWidth": 23,
//     "shortDescription": "Classic white beveled mat",
//     "color": "black",
//     "status": true,
//     "thumbnailUrl": "https://www.dropbox.com/scl/fi/bi8rj1j3jbwbc0ljlqfal/1766499797787.jpg?rlkey=ajhd4y8z1f4ag2sqfpcff7wz2&raw=1",
//     "__v": 0
//   },
//   {
//     "_id": "69494f0a522251b1ewb2eacd2",
//     "optionName": "Single Black Mat",
//     "priceDeltaMinor": 53,
//     "shortDescription": "Modern black beveled mat",
//     "matWidth": 45,
//     "color": "black",
//     "status": false,
//     "thumbnailUrl": "https://www.dropbox.com/scl/fi/l7nrt32vicpdtivd1w26s/1766493779446.jpg?rlkey=8fq736c9bh5jutnhfhav8epnm&raw=1",
//     "__v": 0
//   },
//   {
//     "_id": "69494f02a522251wb1eb2eacd2",
//     "optionName": "Single Black Mat",
//     "priceDeltaMinor": 53,
//     "shortDescription": "Modern black beveled mat",
//     "matWidth": 45,
//     "color": "black",
//     "status": false,
//     "thumbnailUrl": "https://www.dropbox.com/scl/fi/l7nrt32vicpdtivd1w26s/1766493779446.jpg?rlkey=8fq736c9bh5jutnhfhav8epnm&raw=1",
//     "__v": 0
//   },
//   {
//     "_id": "69494f02a522251b1ewb2eacd2",
//     "optionName": "Single Black Mat",
//     "priceDeltaMinor": 53,
//     "shortDescription": "Modern black beveled mat",
//     "matWidth": 45,
//     "color": "black",
//     "status": false,
//     "thumbnailUrl": "https://www.dropbox.com/scl/fi/l7nrt32vicpdtivd1w26s/1766493779446.jpg?rlkey=8fq736c9bh5jutnhfhav8epnm&raw=1",
//     "__v": 0
//   },
//   {
//     "_id": "69494f0a5222512b1eb2eacd2",
//     "optionName": "Single Black Mat",
//     "priceDeltaMinor": 53,
//     "shortDescription": "Modern black beveled mat",
//     "matWidth": 45,
//     "color": "black",
//     "status": false,
//     "thumbnailUrl": "https://www.dropbox.com/scl/fi/l7nrt32vicpdtivd1w26s/1766493779446.jpg?rlkey=8fq736c9bh5jutnhfhav8epnm&raw=1",
//     "__v": 0
//   }
// ]

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


// No border and mat data
const NO_BORDER_OPTION = {
  _id: "no-border",
  thickness: 0,
  color: null,
  priceDeltaMinor: 0,
  label: "No Border",
};

const NO_Mat_OPTION = {
  _id: "no-mat",
  optionName: "No Mat",
  priceDeltaMinor: 0,
  label: "No Mat",
};


const StepFinish = ({ template, orderConfig, setOrderConfig }) => {
  console.log("------orderConfig", orderConfig)
  // Mat data set
  // const Mats = template?.metaOptions;
  const rawMats = template?.metaOptions || [];

  const Mats = [
    NO_Mat_OPTION,
    ...rawMats.filter(l => l.status !== false),
  ];

  // Borders data set
  const rawBorders = template?.borderOptions || [];
  const borderOptions = [
    NO_BORDER_OPTION,
    ...rawBorders.filter(b => b.status),
  ];


  // get mat or border option available
  const hasMatOptions =
    Array.isArray(Mats) &&
    Mats.length > 1; // more than "No Mat"

  const hasBorderOptions =
    Array.isArray(borderOptions) &&
    borderOptions.length > 1; // more than "No Border"


  const [borderSize, setBorderSize] = useState('0');
  const [selectedBorder, setSelectedBorder] = useState(NO_BORDER_OPTION);
  const [imageSrc, setImageSrc] = useState(null);
  const [activeTab, setActiveTab] = useState("Mat");
  const [activeMat, setActiveMat] = useState(NO_Mat_OPTION);
  const [quantityAndLimits, setquantityAndLimits] = useState([])
  const basePrice = 68;
  // Default for quantity integration
  const quantityRule = quantityAndLimits?.[0];
  const minQty = quantityRule?.minQuantity ?? 1;
  const maxQty = quantityRule?.maxQuantity ?? 20;
  const stepQty = quantityRule?.stepSize ?? 1;
  const defaultQty = quantityRule?.defaultQuantity ?? 1;
  const validationMsg =
    quantityRule?.previewValidationMessage ??
    `Please select a quantity between ${minQty} and ${maxQty}.`;
  const [quantity, setQuantity] = useState(defaultQty);

  // function to call api
  const fetchData = async () => {
    const data = await getCommerceRulesQuantityAndLimits();
    setquantityAndLimits(data);
  };
  console.log("----------quantityAndLimits", quantityAndLimits)

  // const handleQuantityChange = (value) => {
  //   const newQuantity = Math.max(1, Math.min(20, value));
  //   setQuantity(newQuantity);
  // };
  const handleQuantityChange = (value) => {
    if (isNaN(value)) return;

    let newValue = Math.round(value / stepQty) * stepQty;

    if (newValue < minQty) newValue = minQty;
    if (newValue > maxQty) newValue = maxQty;

    setQuantity(newValue);
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


  useEffect(() => {


    fetchData();
  }, []);

  useEffect(() => {
    if (quantityRule?.defaultQuantity) {
      setQuantity(quantityRule.defaultQuantity);
    }
  }, [quantityRule]);



  // load initial data

  useEffect(() => {
    if (!selectedBorder && borderOptions.length) {
      setSelectedBorder(NO_BORDER_OPTION);
    }
  }, [borderOptions, selectedBorder]);


  useEffect(() => {
    if (!setActiveMat && rawMats.length) {
      setActiveMat(NO_Mat_OPTION);
    }
  }, [rawMats, setActiveMat]);


  // tab handle
  useEffect(() => {
    if (activeTab === "Mat" && !hasMatOptions && hasBorderOptions) {
      setActiveTab("Border");
    }

    if (activeTab === "Border" && !hasBorderOptions && hasMatOptions) {
      setActiveTab("Mat");
    }
  }, [hasMatOptions, hasBorderOptions, activeTab]);


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
            <span className="summary-value">{orderConfig?.size?.label || "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Paper</span>
            <span className="summary-value">{orderConfig?.paper?.name || "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Border</span>
            <span className="summary-value">{orderConfig?.border?.thickness + '"' || "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Lamination</span>
            <span className="summary-value">{orderConfig?.lamination?.name || "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Mounting</span>
            <span className="summary-value">{orderConfig?.mounting?.name || "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Mat</span>
            <span className="summary-value">{orderConfig?.mat?.name || "None"}</span>
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

      <div className='right-section'>
        <div className='tab'>
          {hasMatOptions && (<div className={`tab-option ${activeTab == "Mat" ? "active-tab" : ""}`} onClick={() => { setActiveTab("Mat") }}>Mat</div>)}
          {hasBorderOptions && (<div className={`tab-option ${activeTab == "Border" ? "active-tab" : ""}`} onClick={() => { setActiveTab("Border") }}>Border</div>)}


        </div>


        {
          activeTab == "Mat" ?
            <div className='mat-wrapper'>
              <h3 className="subsection-title">Mat Style </h3>

              {Mats.map((mat) => {
                const isNotOption = mat.optionName == "No Mat";
                return <div className={`mat-container ${activeMat?._id == mat._id ? "active-mat" : ""} `} onClick={() => {
                  setActiveMat(mat);

                  setOrderConfig((prev) => ({
                    ...prev,
                    mat:
                      mat._id === "no-mat"
                        ? null
                        : {
                          id: mat._id,
                          name: mat.optionName,
                          price: mat.priceDeltaMinor,
                        },
                  }));
                }}
                >
                  <div className='mat-left'>
                    {
                      !isNotOption &&
                      <div className='mat-left-image-container'>
                        <img src={mat.thumbnailUrl} height={50} width={50}></img>
                      </div>
                    }
                    <div className='mat-left-text-container'>
                      <div className='mat-left-text'>{mat.optionName}</div>
                      <div className='mat-left-text'>{mat.shortDescription}</div>
                    </div>
                  </div>
                  {
                    !isNotOption &&
                    <div className='mat-right'>
                      +${mat.priceDeltaMinor}
                    </div>
                  }
                </div>
              })}
            </div> :
            // Border tab
            <div className="border-section">
              <h3 className="subsection-title">Border Size</h3>
              <div className="border-grid">
                {borderOptions.map((border) => {
                  const isActive = selectedBorder?._id === border._id;

                  return (
                    <button
                      key={border._id}
                      className={`border-button ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setSelectedBorder(border);

                        setOrderConfig((prev) => ({
                          ...prev,
                          border:
                            border.thickness === 0
                              ? null
                              : {
                                id: border._id,
                                thickness: border.thickness,
                                price: border.priceDeltaMinor,
                              },
                        }));
                      }}

                    >
                      {border.thickness === 0
                        ? "No Border"
                        : `${border.thickness}"`}
                    </button>
                  );
                })}
              </div>

              <p className="border-note">Borders are blank space added around your image, not a mat or frame.</p>
            </div>
        }
        <div className="config-section">


          <div className="quantity-section">
            <h3 className="subsection-title">Quantity</h3>
            <div className="quantity-control">
              <button
                className={`quantity-button ${quantity <= minQty ? "quantity-button-disabled" : ""
                  }`}
                onClick={() => handleQuantityChange(quantity - stepQty)}
                disabled={quantity <= minQty}
              >
                -
              </button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                min={minQty}
                max={maxQty}
                step={stepQty}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
              />
              <button
                className={`quantity-button ${quantity >= maxQty ? "quantity-button-disabled" : ""
                  }`}
                onClick={() => handleQuantityChange(quantity + stepQty)}
                disabled={quantity >= maxQty}
              >
                +
              </button>
              {/* <span className="quantity-limit">(Max 20 per order)</span>
               */}
              <span className="quantity-limit">
                (Min {minQty}, Max {maxQty})
              </span>

            </div>
          </div>
          {validationMsg ? (
            <p className="quantity-warning">{validationMsg}</p>
          ) : null}

          <div className="price-breakdown">
            <h3 className="breakdown-title">Price Breakdown</h3>
            <div className="breakdown-row">
              <span className="breakdown-label">Base price (16×20")</span>
              <span className="breakdown-value">${basePrice}</span>
            </div>

            <div className="breakdown-row">
              <span className="breakdown-label">Border</span>
              <span className="breakdown-value">+{orderConfig?.border?.price}%</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Mat</span>
              <span className="breakdown-value">+{orderConfig?.border?.price}$</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Lamination</span>
              <span className="breakdown-value">+{orderConfig?.lamination?.priceDeltaMinor}%</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Paper upgrade (Metallic Gloss)</span>
              <span className="breakdown-value">+{orderConfig?.paper?.priceDeltaMinor}%</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Mounting (Acrylic Face Mount)</span>
              <span className="breakdown-value">+{orderConfig?.mounting?.priceDeltaMinor}$</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Quantity</span>
              <span className="breakdown-value">×{quantity}</span>
            </div>
            <div className="breakdown-row breakdown-total">
              <span className="breakdown-label">Total</span>
              <span className="breakdown-value-total">${total}</span>
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
    </div>
  );
};
export default StepFinish;
