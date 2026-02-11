import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Paper.css';
import { TooltipHoverIcon } from '../../../utils/CustomIcon';
import { loadCropImageFromDb } from '../../../services/indexDb';
import { getDeltaAmount } from '../../../utils/PercentFormatter';

// --- Component ---

const Paper = ({ handleBack, handleNext, template, orderConfig, updateOrderConfig }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const Productprice = urlParams.get('price');
  // only show those paper whose status is true 
  const PAPERS = useMemo(() => {
    return (template?.paperOptions || []).filter(
      (paper) => paper.status === true
    );
  }, [template?.paperOptions]);

  const [imageSrc, setImageSrc] = useState(null);
  const [selectedPaperId, setSelectedPaperId] = useState(orderConfig?.paper?.id ?? null);
  const [truncatedDescriptions, setTruncatedDescriptions] = useState({});
  const descriptionRefs = useRef({});

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

  const [paperImageLoadedMap, setPaperImageLoadedMap] = useState({});

  const handlePaperImageLoaded = (id) => {
    setPaperImageLoadedMap(prev => ({
      ...prev,
      [id]: true,
    }));
  };

  // Check truncation after papers load
  useEffect(() => {
    const newTruncated = {};
    PAPERS?.forEach((paper) => {
      const element = descriptionRefs.current[paper._id];
      if (element) {
        newTruncated[paper._id] = element.scrollWidth > element.clientWidth;
      }
    });
    setTruncatedDescriptions(newTruncated);
  }, [PAPERS]);

  // Auto-update config when selection changes
  useEffect(() => {
    if (!selectedPaper) return;

    updateOrderConfig({
      paper: {
        id: selectedPaper._id,
        name: selectedPaper.paperName,
        finish: selectedPaper.finish,
        weight: selectedPaper.weight,
        priceDeltaMinor: selectedPaper.priceDeltaMinor,
        thumbnailUrl: selectedPaper.thumbnailUrl,
        additionalNotes: selectedPaper.AdditionalNotes,
      },
    });
  }, [selectedPaperId, selectedPaper, updateOrderConfig]);

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
                <p className='selected-size'>{orderConfig?.size?.width} X {orderConfig?.size?.height}"  print</p>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE – PAPER GRID */}
          <div className="editor-right-paper">
            <div className="editor-title">
              <h2 className="editor-title-right">
                Select Paper
              </h2>
              {/* <p>
                Choose from our collection of museum-grade fine art papersthumbnailUrl
              </p> */}
            </div>
            <div className="paper-grid">
              {PAPERS?.map((paper) => (
                <button
                  key={paper._id}
                  onClick={() => setSelectedPaperId(paper._id)}
                  className={`paper-card ${selectedPaperId === paper._id ? "paper-card-selected" : ""
                    }`}
                >
                  <div className="paper-card-thumb">
                    {/* Skeleton (always rendered) */}
                    <div
                      className={`paper-thumb-skeleton ${paperImageLoadedMap[paper._id] ? "hide" : ""
                        }`}
                    />

                    {/* Image */}
                    <img
                      src={paper.thumbnailUrl}
                      alt={paper.paperName}
                      className="paper-thumb-image"
                      onLoad={() => handlePaperImageLoaded(paper._id)}
                      onError={() => handlePaperImageLoaded(paper._id)}
                      loading="lazy"
                    />

                    {/* Radio */}
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
                          <p className='bold'>Additional Notes:</p>
                          {paper.AdditionalNotes || "No Info"}
                        </div>
                      </div>
                    </div>


                  </div>

                  <div className="paper-card-tags">
                    <span className="paper-tag"> {paper.finish?.charAt(0).toUpperCase() + paper.finish?.slice(1)}</span>
                    {/* <span className="paper-tag paper-tag-outline">
                      {paper.weight || "22gsm"}
                    </span> */}

                  </div>

                  <div className="paper-card-description-wrapper">
                    <p
                      className="paper-card-description"
                      ref={(el) => {
                        if (el) {
                          descriptionRefs.current[paper._id] = el;
                        }
                      }}
                    >
                      {paper.shortDescription}
                    </p>
                    {truncatedDescriptions[paper._id] && paper.shortDescription && (
                      <div className="paper-card-description-tooltip">
                        <p className='bold'>Short Desciption:</p>
                        {paper.shortDescription}
                      </div>
                    )}
                  </div>

                  <div className="paper-card-price-row">
                    <span
                      className={
                        'paper-price-adjust ' +
                        (paper.priceAdjustment < 0
                          ? 'paper-price-adjust-down'
                          : '')
                      }
                    >

                      +{Math.abs(paper.priceDeltaMinor)}
                      {paper.priceDeltaMinor > 0 ? '%' : ''}
                      <span style={{ marginLeft: '2px' }}> (${getDeltaAmount(orderConfig?.size?.price, paper.priceDeltaMinor)})</span>

                    </span>
                  </div>

                </button>
              ))}
            </div>
            <div className="footer-inner">
              <button
                className="footer-btn footer-btn-outline"
                onClick={() => handleBack()}
              >
                Back
              </button>

              <button
                className="footer-btn footer-btn-primary"
                disabled={!selectedPaper}
                onClick={() =>
                  handleNext()}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

    </div >
  );
};

export default Paper;