import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Paper.css';
import { TooltipHoverIcon } from '../../../utils/CustomIcon';
import { loadCropImageFromDb } from '../../../services/indexDb';


// --- Component ---

const Paper = ({ handleBack, handleNext, template, orderConfig }) => {

  // only show thiose paper whose status is true 
  const PAPERS = useMemo(() => {
    return (template?.paperOptions || []).filter(
      (paper) => paper.status === true
    );
  }, [template?.paperOptions]);

  // console.log("--paper", PAPERS)

  const [imageSrc, setImageSrc] = useState(null);
  const [selectedPaperId, setSelectedPaperId] = useState(orderConfig?.paper?.id ?? null);



  // Load image from IndexedDB
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


  // Auto-select first paper when data loads
  useEffect(() => {
    if (PAPERS?.length && !selectedPaperId) {
      setSelectedPaperId(PAPERS[0]._id);
    }
  }, [PAPERS, selectedPaperId]);


  const selectedPaper = useMemo(
    () => PAPERS?.find((paper) => paper._id === selectedPaperId) ?? PAPERS?.[0],
    [PAPERS, selectedPaperId]
  );
  // const selectedPaper = PAPERS?.find(
  //   (paper) => paper._id === selectedPaperId
  // );



  return (
    <div className="editor-page">
      <div className="editor-container">
        <div className="content">
          {/* LEFT SIDE */}
          <div className="editor-left">
            <h2>Preview</h2>

            <div
              className="editor-crop-area-paper"
            >
              <div
                className="papar-editor-image-wrapper-paper"
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="papar-editor-image"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#888',
                      fontSize: '14px',
                      padding: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    No image found. Please upload an image first.
                  </div>
                )}
                <p className='selected-size'>{orderConfig?.size?.width} X {orderConfig?.size?.height}" print print</p>
              </div>

              {/* <div className="editor-size-label">
                {selectedPaper ? selectedPaper.name : 'Select a paper'}
              </div> */}
            </div>

          </div>

          {/* RIGHT SIDE – PAPER GRID */}
          <div className="editor-right">

            <h2 className="editor-title-right">
              Select Paper
            </h2>
            <p>
              Choose from our collection of museum-grade fine art papersthumbnailUrl
            </p>

            <div className="paper-grid">
              {PAPERS?.map((paper) => (
                <button
                  key={paper._id}
                  onClick={() => setSelectedPaperId(paper._id)}
                  className={`paper-card ${selectedPaperId === paper._id ? "paper-card-selected" : ""
                    }`}
                >
                  {/* Thumbnail area */}
                  <div className="paper-card-thumb">
                    {/* you can swap this gradient for real sample images later */}
                    {/* <div className="paper-card-thumb-art" /> */}
                    <img src={paper?.thumbnailUrl}></img>
                    <div className="paper-card-radio">
                      {selectedPaperId === paper._id && (
                        <div className="paper-card-radio-outer">
                          <svg
                            className="checkIcon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Text area */}
                  <div className="paper-card-body">
                    <div className="paper-card-name-row">
                      <span className="paper-card-name">{paper.paperName}</span>


                      <div className="tooltip-wrapper">

                        <TooltipHoverIcon />

                        {/* Tooltip */}
                        <div className="tooltip-content">
                          {paper.AdditionalNotes || "No Info"}
                        </div>
                      </div>
                    </div>


                  </div>

                  <div className="paper-card-tags">
                    <span className="paper-tag"> {paper.finish?.charAt(0).toUpperCase() + paper.finish?.slice(1)}</span>
                    <span className="paper-tag paper-tag-outline">
                      {paper.weight || "22gsm"}
                    </span>

                  </div>

                  <p className="paper-card-description">{paper.shortDescription}</p>

                  <div className="paper-card-price-row">
                    <span
                      className={
                        'paper-price-adjust ' +
                        (paper.priceAdjustment < 0
                          ? 'paper-price-adjust-down'
                          : '')
                      }
                    >
                      {paper.priceDeltaMinor > 0 ? '+ $' : '- $'}
                      {Math.abs(paper.priceDeltaMinor)}
                    </span>
                  </div>

                </button>
              ))}
            </div>
            <div className="footer-inner">
              <button
                className="footer-btn footer-btn-outline"
                onClick={() => handleBack()}
              // disabled={currentStep === 1}
              >
                Back
              </button>

              <button
                className="footer-btn footer-btn-primary"
                disabled={!selectedPaper}
                onClick={() =>
                  handleNext({
                    paper: {
                      id: selectedPaper._id,
                      name: selectedPaper.paperName,
                      finish: selectedPaper.finish,
                      weight: selectedPaper.weight,
                      priceDeltaMinor: selectedPaper.priceDeltaMinor,
                      thumbnailUrl: selectedPaper.thumbnailUrl,
                      additionalNotes: selectedPaper.AdditionalNotes,
                    },
                  })}
              // onClick={handleContinue}
              // disabled={!canContinue()}
              >
                Continue
                {/* {currentStep === 4 ? "Add to Cart" : "Continue"} */}
              </button>
            </div>
            {/* Action Buttons */}
          </div>
        </div>
      </div>

    </div >
  );
};

export default Paper;



// const FooterBar = ({ currentStep, handleBack, handleContinue, canContinue }) => {
//   currentStep = 3; // Paper step
//   return (
//     <div className="footer-bar">
//       <div className="footer-inner">
//         <button
//           className="footer-btn footer-btn-outline"
//           onClick={() => handleBack()}
//         // disabled={currentStep === 1}
//         >
//           Back
//         </button>

//         <button
//           className="footer-btn footer-btn-primary"
//           onClick={() => hanndleNext()}
//         // onClick={handleContinue}
//         // disabled={!canContinue()}
//         >
//           {currentStep === 4 ? "Add to Cart" : "Continue"}
//         </button>
//       </div>
//     </div>
//   );
// };