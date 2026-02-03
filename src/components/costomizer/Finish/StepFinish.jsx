import React, { useEffect, useState, useRef, useMemo } from 'react';
import './stepFinish.css'
import { getCommerceRulesCustomerDiscounts, getCommerceRulesQuantityAndDiscounts, getCommerceRulesQuantityAndLimits } from '../../../services/services';
import { loadCropImageFromDb } from '../../../services/indexDb';
import { cartHandler } from './helper';
import { calculateOrderPrice } from '../../../services/calculateOrderTotal';
import { RiSubtractFill } from "react-icons/ri";

import { IoCartOutline } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { toast } from 'react-toastify';



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

const StepFinish = ({ template, orderConfig, setOrderConfig, handleBack, customerTags }) => {

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product_id');
  const Productprice = urlParams.get('price');



  // console.log("---------productId", productId)
  const rawMats = template?.metaOptions || [];
  const Mats = [NO_Mat_OPTION, ...rawMats.filter(l => l.status !== false)];

  const rawBorders = template?.borderOptions || [];
  const borderOptions = [NO_BORDER_OPTION, ...rawBorders.filter(b => b.status)];

  const hasMatOptions = Array.isArray(Mats) && Mats.length > 1;
  const hasBorderOptions = Array.isArray(borderOptions) && borderOptions.length > 1;

  const [selectedBorder, setSelectedBorder] = useState(NO_BORDER_OPTION);
  const [imageSrc, setImageSrc] = useState(null);
  const [activeTab, setActiveTab] = useState("Mat");
  const [activeMat, setActiveMat] = useState(NO_Mat_OPTION);
  const [quantityAndLimits, setquantityAndLimits] = useState([]);
  const [status, setStatus] = useState("start");
  const [borderPx, setBorderPx] = useState(0);
  const showTabs = hasMatOptions && hasBorderOptions;
  // check that this option exist or not 
  const hasPaperOptions =
    Array.isArray(template?.paperOptions) &&
    template.paperOptions.some(p => p.status);

  const hasLaminationOptions =
    Array.isArray(template?.laminationOptions) &&
    template.laminationOptions.some(l => l.status);

  const hasMountingOptions =
    Array.isArray(template?.mountingOptions) &&
    template.mountingOptions.some(m => m.status);
  const hasSizeOptions = Array.isArray(template?.sizeOptions) && template.sizeOptions.length > 0;


  // console.log("-orderConfig", orderConfig)
  // api discount data
  const [customerDiscountRules, setCustomerDiscountRules] = useState([]);
  const [quantityDiscountRules, setQuantityDiscountRules] = useState([]);


  // loading states
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartError, setCartError] = useState(null);


  // Ref for image to measure actual rendered size
  const imageRef = useRef(null);






  const quantityRule = quantityAndLimits?.[0];
  const minQty = quantityRule?.minQuantity ?? 1;
  const maxQty = quantityRule?.maxQuantity ?? 20;
  const stepQty = quantityRule?.stepSize ?? 1;
  const defaultQty = quantityRule?.defaultQuantity ?? 1;
  const validationMsg = quantityRule?.previewValidationMessage ??
    `Please select a quantity between ${minQty} and ${maxQty}.`;
  const [quantity, setQuantity] = useState(defaultQty);


  const basePrice = productId ? Number(Productprice) : 0;
  // const percentBasePrice = basePrice * quantity;

  const percentBasePrice = useMemo(() => {
    if (!basePrice || !quantity) return 0;
    return Number(basePrice) * Number(quantity);
  }, [basePrice, quantity]);



  const fetchData = async () => {
    const data = await getCommerceRulesQuantityAndLimits();
    setquantityAndLimits(data);
  };

  const handleQuantityChange = (value) => {
    if (isNaN(value)) return;
    let newValue = Math.round(value / stepQty) * stepQty;
    if (newValue < minQty) newValue = minQty;
    if (newValue > maxQty) newValue = maxQty;
    setQuantity(newValue);
    setOrderConfig((prev) => ({ ...prev, quantity: newValue }));

  };
  // helper to show price with percent
  const formatPercentWithPrice = (percent) => {
    if (!percent || !percentBasePrice) return `+0% ($0.00)`;

    const price = (percentBasePrice * percent) / 100;
    return `+${percent}% ($${price.toFixed(2)})`;
  };




  const total = useMemo(() => {
    if (!customerDiscountRules.length || !quantityDiscountRules.length) {
      return 0;
    }

    return calculateOrderPrice({
      orderConfig: {
        ...orderConfig,
        quantity,
        tags: customerTags || [],

        // tags: ["wsgtesttag", "test_wholesale"],
      },
      customerDiscountRules,
      quantityDiscountRules,
      Productprice
    });
  }, [
    orderConfig,
    quantity,
    customerDiscountRules,
    quantityDiscountRules,
  ]);
  console.log("----totalls", total)

  // ✅ CORRECT APPROACH: Calculate border in pixels based on actual image size
  const calculateBorderPx = () => {
    const borderThicknessIn = selectedBorder?.thickness || 0;
    if (!borderThicknessIn) return 0;

    const printWidthIn = orderConfig?.size?.width;
    if (!printWidthIn) return 0;

    const img = imageRef.current;
    if (!img) return 0;

    const previewWidthPx = img.clientWidth;

    // Real-world proportional border
    const realBorderPx =
      (borderThicknessIn / printWidthIn) * previewWidthPx;

    // UX scaling (visual softening)
    const PREVIEW_BORDER_SCALE = 0.35;

    return Math.round(realBorderPx * PREVIEW_BORDER_SCALE);
  };

  // Update border whenever image loads or border selection changes
  useEffect(() => {
    const updateBorder = () => {
      const px = calculateBorderPx();
      setBorderPx(px);
    };

    // Update on border change
    updateBorder();

    // Also update on window resize
    window.addEventListener('resize', updateBorder);
    return () => window.removeEventListener('resize', updateBorder);
  }, [selectedBorder, orderConfig?.size, imageSrc]);

  const getBorderStyle = () => {
    // console.log("------orderConfig", orderConfig)
    if (borderPx === 0) {
      return { padding: 0 };
    }

    return {
      // padding: `${borderPx}px`,
      border: `${borderPx}px solid ${selectedBorder?.color || '#ffffff'}`,
      // backgroundColor: selectedBorder?.color || '#ffffff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    };
  };

  // const total = basePrice * quantity;

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadCropImageFromDb();
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
      setOrderConfig((prev) => ({ ...prev, quantity: quantityRule.defaultQuantity }));
    }
  }, [quantityRule]);

  // useEffect(() => {
  //   if (!selectedBorder && borderOptions.length) {
  //     setSelectedBorder(NO_BORDER_OPTION);
  //   }
  // }, [borderOptions, selectedBorder]);

  // useEffect(() => {
  //   if (!activeMat && rawMats.length) {
  //     setActiveMat(NO_Mat_OPTION);
  //   }
  // }, [rawMats, activeMat]);


  // Add these two useEffect hooks (place them near your other useEffects, e.g., after the quantityRule effect)


  // Restore selectedBorder from orderConfig when component mounts or orderConfig changes
  useEffect(() => {
    if (!borderOptions.length) return;

    if (orderConfig?.border?.id) {
      const matched = borderOptions.find(b => b._id === orderConfig.border.id);
      if (matched) {
        setSelectedBorder(matched);
        return;
      }
    }
    // Fallback: no border selected (or invalid id)
    setSelectedBorder(NO_BORDER_OPTION);
  }, [orderConfig?.border, borderOptions]);

  // Restore activeMat from orderConfig when component mounts or orderConfig changes
  useEffect(() => {
    if (!Mats.length) return;

    if (orderConfig?.mat?.id) {
      const matched = Mats.find(m => m._id === orderConfig.mat.id);
      if (matched) {
        setActiveMat(matched);
        return;
      }
    }
    // Fallback: no mat selected (or invalid id)
    setActiveMat(NO_Mat_OPTION);
  }, [orderConfig?.mat, Mats]);

  useEffect(() => {
    if (!showTabs) {

      if (activeTab === "Mat" && !hasMatOptions && hasBorderOptions) {
        setActiveTab("Border");
      }
      if (activeTab === "Border" && !hasBorderOptions && hasMatOptions) {
        setActiveTab("Mat");
      }
    }
  }, [hasMatOptions, hasBorderOptions, activeTab]);



  // useeffect for discount csaal
  useEffect(() => {
    (async () => {
      const customerRes = await getCommerceRulesCustomerDiscounts();
      const quantityRes = await getCommerceRulesQuantityAndDiscounts();

      setCustomerDiscountRules(customerRes?.[0]?.customerTiers ? customerRes : []);
      setQuantityDiscountRules(quantityRes?.[0]?.discountTiers || []);
    })();
  }, []);


  const [matImageLoadedMap, setMatImageLoadedMap] = useState({});

  const handleMatImageLoaded = (id) => {
    setMatImageLoadedMap(prev => ({
      ...prev,
      [id]: true,
    }));
  };

  return (
    <div className="containerr">
      <div className="preview-section">
        <h2 className="section-title">Preview</h2>
        <div className="preview-box">
          <div
            className="preview-image-container"
            style={{
              ...getBorderStyle(),
              // borderRadius: '8px',
              overflow: 'hidden',
              maxWidth: '100%',
              display: 'inline-block',
            }}
          >
            <img
              ref={imageRef}
              src={imageSrc || "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&h=500&fit=crop"}
              alt="preview-image"
              className="preview-image"
              onLoad={() => {
                // Recalculate border when image loads
                const px = calculateBorderPx();
                setBorderPx(px);
              }}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                borderRadius: '0',
              }}
            />
          </div>
          <p className="preview-label">
            {orderConfig?.size?.width} X { } {orderConfig?.size?.height}" print
            {/* {selectedBorder?.thickness > 0 &&
              ` with ${selectedBorder.thickness}" ${selectedBorder.color || 'white'} border`
            } */}
          </p>


        </div>

        <div className="order-summary">
          <h3 className="summary-title">Order Summary</h3>
          <div className="summary-row">
            <span className="summary-label">Size</span>
            <span className="summary-value">{orderConfig?.size?.label ?? "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Paper</span>
            <span className="summary-value">{orderConfig?.paper?.name ?? "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Border</span>
            <span className="summary-value">
              {selectedBorder?.thickness === 0
                ? "None"
                : `${selectedBorder.thickness}"`
              }
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Lamination</span>
            <span className="summary-value">{orderConfig?.lamination?.name ?? "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Mounting</span>
            <span className="summary-value">{orderConfig?.mounting?.name ?? "None"}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Mat</span>
            <span className="summary-value">{activeMat?.optionName ?? "None"}</span>
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

        {showTabs && (

          <div className='tab'>
            {hasMatOptions && (
              <div
                className={`tab-option ${activeTab === "Mat" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("Mat")}
              >
                Mat
              </div>
            )}
            {hasBorderOptions && (
              <div
                className={`tab-option ${activeTab === "Border" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("Border")}
              >
                Border
              </div>
            )}
          </div>
        )}

        {activeTab === "Mat" && hasMatOptions && (
          <div className='mat-wrapper'>
            <h3 className="subsection-title">Mat Style</h3>
            {Mats.map((mat) => {
              const isNoMat = mat.optionName === "No Mat";
              return (
                <div
                  key={mat._id}
                  className={`mat-container ${activeMat?._id === mat._id ? "active-mat" : ""}`}
                  onClick={() => {
                    setActiveMat(mat);
                    setOrderConfig((prev) => ({
                      ...prev,
                      mat: mat._id === "no-mat" ? null : {
                        id: mat._id,
                        name: mat.optionName,
                        price: mat.priceDeltaMinor,
                      },
                    }));
                  }}
                >
                  <div className='mat-left'>
                    {!isNoMat && (
                      <div className="mat-thumb-wrapper">
                        {/* Skeleton */}
                        <div
                          className={`mat-thumb-skeleton ${matImageLoadedMap[mat._id] ? "hide" : ""
                            }`}
                        />

                        {/* Image */}
                        <img
                          src={mat.thumbnailUrl}
                          alt={mat.optionName}
                          className="mat-thumb-image"
                          onLoad={() => handleMatImageLoaded(mat._id)}
                          onError={() => handleMatImageLoaded(mat._id)}
                          loading="lazy"
                        />
                      </div>


                    )}
                    <div className='mat-left-text-container'>
                      <div className='mat-left-text'>{mat.optionName}</div>
                      <div className='mat-left-text'>{mat.shortDescription}</div>
                    </div>
                  </div>
                  {!isNoMat && (
                    <div className='mat-right'>
                      +${mat.priceDeltaMinor}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Border' && hasBorderOptions && (
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
                        border: border.thickness === 0 ? null : {
                          id: border._id,
                          thickness: border.thickness,
                          color: border.color,
                          priceDeltaMinor: border.priceDeltaMinor,
                        },
                      }));
                    }}
                  >
                    {border.thickness === 0 ? "No Border" : `${border.thickness}"`}
                  </button>
                );
              })}
            </div>
            <p className="border-note">
              Borders are blank space added around your image, not a mat or frame.
            </p>
          </div>
        )}

        <div className="config-section">
          <div className="quantity-section">
            <h3 className="subsection-title">Quantity</h3>
            <div className="quantity-control">
              <button
                className={`quantity-button ${quantity <= minQty ? "quantity-button-disabled" : ""}`}
                onClick={() => handleQuantityChange(quantity - stepQty)}
                disabled={quantity <= minQty}
              >
                <RiSubtractFill />
              </button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                // min={minQty}
                max={maxQty}
                step={stepQty}
                onChange={(e) => {
                  if (e.target.value <= maxQty && e.target.value >= minQty) {
                    setQuantity(Number(e.target.value));

                  }
                  else {
                    setQuantity(prev => Math.min(prev, minQty));
                  }
                }}
              />
              <button
                className={`quantity-button ${quantity >= maxQty ? "quantity-button-disabled" : ""}`}
                onClick={() => handleQuantityChange(quantity + stepQty)}
                disabled={quantity >= maxQty}
              >
                <FaPlus />
              </button>
              <span className="quantity-limit">(Min {minQty}, Max {maxQty})</span>
            </div>
          </div>
          {validationMsg && <p className="quantity-warning">{validationMsg}</p>}

          <div className="price-breakdown">
            <h3 className="breakdown-title">Price Breakdown</h3>


            <div className="breakdown-row">

              {/* <span className="breakdown-label">Base price ({orderConfig?.size?.label || "16×20\""})</span> */}
              <span className="breakdown-label">Base price </span>

              <span className="breakdown-value">${Number(percentBasePrice).toFixed(2)}</span>
            </div>





            {/* size */}
            {hasSizeOptions && orderConfig?.size?.label && (

              <div className="breakdown-row">

                <span className="breakdown-label">Size ({orderConfig?.size?.label || "16×20\""})</span>
                <span className="breakdown-value">+${orderConfig?.size?.price}</span>
              </div>

            )

            }

            {/* border */}
            {hasBorderOptions && (

              <div className="breakdown-row">
                <span className="breakdown-label">Border</span>
                <span className="breakdown-value">  {formatPercentWithPrice(orderConfig?.border?.priceDeltaMinor)}</span>
              </div>

            )}

            {hasMatOptions && (
              <div className="breakdown-row">
                <span className="breakdown-label">Mat</span>
                <span className="breakdown-value">+${orderConfig?.mat?.price || 0}</span>
              </div>

            )}

            {hasLaminationOptions && (
              <div className="breakdown-row">
                <span className="breakdown-label">Lamination</span>
                <span className="breakdown-value"> {formatPercentWithPrice(orderConfig?.lamination?.priceDeltaMinor)}</span>
              </div>

            )}

            {hasPaperOptions && (

              <div className="breakdown-row">
                <span className="breakdown-label">Paper upgrade</span>
                <span className="breakdown-value"> {formatPercentWithPrice(orderConfig?.paper?.priceDeltaMinor)}</span>
              </div>
            )

            }

            {hasMountingOptions && (

              <div className="breakdown-row">
                <span className="breakdown-label">Mounting</span>
                <span className="breakdown-value">+${orderConfig?.mounting?.price || 0}</span>
              </div>
            )}


            <div className="breakdown-row">
              <span className="breakdown-label">Quantity</span>
              <span className="breakdown-value">×{quantity}</span>
            </div>
            <div className="breakdown-row breakdown-total">
              <span className="breakdown-label">Total</span>
              <span className="breakdown-value-total">${total}</span>
            </div>
          </div>

          {/* <div className="action-buttons">
            <button className="back-button" onClick={() => handleBack()}>BACK</button>
            
            <button className="add-to-cart-button" onClick={() => cartHandler(setStatus, orderConfig, total, productId)}>
              <IoCartOutline /> ADD TO CART
            </button>
          </div> */}
          <div className="footer-inner">
            <button
              className="footer-btn footer-btn-outline"
              onClick={() => handleBack()}
            // onClick={() => handleBack()}
            >
              Back
            </button>

            {/* <button
              className={`footer-btn footer-btn-primary footer-btn-finish
                                    `}
              onClick={() => cartHandler(setStatus, orderConfig, total, productId)}

            >
              <span className='cartIcon'> <IoCartOutline /></span>Add To Cart
            </button> */}
            <button
              className={`footer-btn footer-btn-primary footer-btn-finish ${isAddingToCart ? "btn-loading" : ""
                }`}
              disabled={isAddingToCart}
              onClick={async () => {
                setCartError(null);
                setIsAddingToCart(true);

                try {
                  await cartHandler(setStatus, orderConfig, total, productId);

                  toast.success("Item added to cart successfully 🎉");
                  // window.location.reload();
                  window.location.href = "https://www.bigoxprinting.com/cart";

                } catch (err) {
                  toast.error(
                    err?.response?.data?.message || err?.message || "Something went wrong. Please try again."
                  );
                  setCartError(err);
                } finally {
                  setIsAddingToCart(false);
                }
              }}
            >
              {isAddingToCart ? (
                <span className="loader-spinner" />
              ) : (
                <>
                  <span className="cartIcon"><IoCartOutline /></span>
                  Add To Cart
                </>
              )}
            </button>


          </div>



          {/* <p className="shipping-note">Free shipping on orders over $100</p> */}
        </div>
      </div>
    </div>
  );
};

export default StepFinish;



// example
// For a 1" border on 16×20" print:

// Preview image width: 400px
// Border ratio: 1" ÷ 16" = 0.0625
// Border in pixels: 400px × 0.0625 = 25px

// For a 0.25" border on 16×20" print:

// Border ratio: 0.25" ÷ 16" = 0.015625
// Border in pixels: 400px × 0.015625 = 6.25px(~6px)